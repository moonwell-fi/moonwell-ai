import type { Command } from "commander";
import ora from "ora";
import {
  createPublicClient,
  http,
  type Address,
  type Hash,
  type PublicClient,
  type Transport,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveChain } from "../lib/chains.js";
import { resolvePrivateKey, addressFromKey } from "../lib/signer.js";
import { isJsonMode, envelope, errorEnvelope, printJson, printError } from "../lib/output.js";
import { header, footer, labelValue, c } from "../lib/format.js";
import { exitCode, usage } from "../lib/errors.js";
import { getContracts } from "../lib/contracts.js";
import { comptrollerAbi, mTokenAbi } from "../lib/abis.js";
import type { GlobalOptions, PrepareResult } from "../lib/types.js";

interface SubmitOptions extends GlobalOptions {
  privateKey?: string;
  actionFile?: string;
}

export function registerSubmit(program: Command): void {
  program
    .command("submit")
    .description("Sign and broadcast prepared transactions")
    .option("--private-key <key>", "Private key (hex)")
    .option("--action-file <path>", "Path to PrepareResult JSON file (or - for stdin)")
    .action(async (opts: SubmitOptions) => {
      const globalOpts = program.opts<GlobalOptions>();
      const json = isJsonMode(globalOpts.json);
      const spinner = json ? null : ora("Preparing to submit...").start();

      try {
        // Resolve private key
        const privateKey = resolvePrivateKey(opts.privateKey);
        const signerAddress = addressFromKey(privateKey);

        // Read PrepareResult from stdin or file
        const prepareResult = await readPrepareResult(opts.actionFile);

        if (!prepareResult.transactions || prepareResult.transactions.length === 0) {
          throw usage("No transactions to submit");
        }

        // Signer binding: the signer must match the address used to prepare.
        if (!prepareResult.from) {
          throw usage(
            "PrepareResult is missing 'from' field. Re-prepare with the current CLI version.",
          );
        }
        if (prepareResult.from.toLowerCase() !== signerAddress.toLowerCase()) {
          throw usage(
            `Signer ${signerAddress} does not match prepared 'from' ${prepareResult.from}. ` +
            `Refusing to sign transactions prepared for a different account.`,
          );
        }

        // Chain binding: use the prepared chainId as the source of truth;
        // reject any --chain override that points at a different network.
        const chainId = prepareResult.chainId ?? prepareResult.transactions[0].chainId;
        if (globalOpts.chain) {
          const requestedChain = resolveChain(globalOpts.chain);
          if (requestedChain.chainId !== chainId) {
            throw usage(
              `--chain ${globalOpts.chain} (id ${requestedChain.chainId}) does not match prepared chainId ${chainId}.`,
            );
          }
        }
        const chain = resolveChain(chainId.toString());

        const account = privateKeyToAccount(privateKey);
        const publicClient = createPublicClient({
          chain: chain.viemChain,
          transport: http(globalOpts.rpcUrl ?? chain.defaultRpcUrl),
        });

        // Target whitelist: verify every tx.to is a known Moonwell contract
        // (Comptroller, mToken, or underlying of an mToken for approve txs).
        await verifyMoonwellTargets(prepareResult, publicClient, chainId);

        if (spinner) spinner.text = `Submitting ${prepareResult.transactions.length} transaction(s) from ${signerAddress}...`;

        const results: TxResult[] = [];

        // Get starting nonce once, increment locally per tx
        let nonce = await publicClient.getTransactionCount({
          address: signerAddress,
          blockTag: "pending",
        });

        for (let idx = 0; idx < prepareResult.transactions.length; idx++) {
          const tx = prepareResult.transactions[idx];
          if (spinner) spinner.text = `Submitting step ${idx + 1}/${prepareResult.transactions.length}: ${tx.step} (nonce ${nonce})...`;

          // Estimate gas. For step 1, failure is a hard error (tx itself is
          // invalid). For steps 2+, RPC may serve stale state that doesn't
          // reflect prior steps, so fall back to 2x the previous step's
          // actual gas usage.
          let gas: bigint;
          let gasEstimated = true;
          try {
            gas = await publicClient.estimateGas({
              account: signerAddress,
              to: tx.to,
              data: tx.data,
              value: BigInt(tx.value),
            });
            gas = gas + (gas / 10n); // 10% buffer
          } catch (estimateErr) {
            if (idx === 0) {
              // Step 1 failing means the tx itself is invalid
              throw estimateErr;
            }
            // Steps 2+: use 2x previous step's actual gas as fallback
            const prevGas = results[idx - 1]
              ? BigInt(results[idx - 1].gasUsed)
              : 300_000n;
            gas = prevGas * 2n;
            gasEstimated = false;
            if (spinner) spinner.text = `Step ${idx + 1}: gas estimation failed (stale RPC state), using fallback ${gas}...`;
          }

          // Get gas price
          const { maxFeePerGas, maxPriorityFeePerGas } =
            await publicClient.estimateFeesPerGas();

          // Sign and serialize
          const signedTx = await account.signTransaction({
            to: tx.to,
            data: tx.data,
            value: BigInt(tx.value),
            gas,
            maxFeePerGas: maxFeePerGas!,
            maxPriorityFeePerGas: maxPriorityFeePerGas!,
            nonce,
            chainId: tx.chainId,
            type: "eip1559",
          });

          // Broadcast
          const hash = await publicClient.sendRawTransaction({
            serializedTransaction: signedTx,
          });

          if (spinner) spinner.text = `Waiting for confirmation: ${tx.step} (${hash.slice(0, 10)}...)`;

          // Wait for receipt
          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 60_000,
          });

          results.push({
            step: tx.step,
            description: tx.description,
            hash,
            status: receipt.status === "success" ? "confirmed" : "failed",
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber.toString(),
            gasEstimated,
          });

          if (receipt.status !== "success") {
            if (spinner) spinner.fail(`Transaction failed: ${tx.step}`);
            break;
          }

          nonce++;
        }

        spinner?.stop();

        const allSuccess = results.every((r) => r.status === "confirmed");

        if (json) {
          printJson(
            envelope("submit", chainId, {
              operation: prepareResult.operation,
              signer: signerAddress,
              results,
              success: allSuccess,
            }),
          );
        } else {
          console.log(
            header(
              `Submit ${prepareResult.operation} \u2014 ${chain.name}`,
            ),
          );
          console.log(labelValue("Signer", signerAddress));
          console.log(labelValue("Operation", prepareResult.operation));
          console.log("");

          for (const r of results) {
            const statusStr =
              r.status === "confirmed"
                ? c.positive("Confirmed")
                : c.negative("Failed");
            console.log(`  ${c.accent(r.step)} ${statusStr}`);
            console.log(labelValue("Tx Hash", r.hash));
            console.log(labelValue("Gas Used", r.gasUsed));
            console.log(labelValue("Block", r.blockNumber));
            if (!r.gasEstimated) {
              console.log(`    ${c.warning("\u26A0")} Gas was estimated using fallback (stale RPC state)`);
            }
            console.log("");
          }

          if (allSuccess) {
            console.log(`  ${c.positive("\u2713")} All transactions confirmed`);
          } else {
            console.log(`  ${c.negative("\u2717")} Some transactions failed`);
          }
          console.log(footer());
        }

        if (!allSuccess) {
          process.exit(1);
        }
      } catch (err) {
        spinner?.fail("Submit failed");
        const message = err instanceof Error ? err.message : String(err);
        if (json) {
          printJson(errorEnvelope("submit", 0, message));
        } else {
          printError(message);
        }
        process.exit(exitCode(err));
      }
    });
}

interface TxResult {
  step: string;
  description: string;
  hash: Hash;
  status: "confirmed" | "failed";
  gasUsed: string;
  blockNumber: string;
  gasEstimated: boolean;
}

async function readPrepareResult(actionFile?: string): Promise<PrepareResult> {
  let raw: string;

  if (actionFile === "-" || (!actionFile && !process.stdin.isTTY)) {
    // Read from stdin
    raw = await readStdin();
  } else if (actionFile) {
    // Read from file
    const fs = await import("node:fs");
    raw = fs.readFileSync(actionFile, "utf-8");
  } else {
    throw usage(
      "Provide PrepareResult via --action-file <path>, --action-file - (stdin), or pipe it in",
    );
  }

  const parsed = JSON.parse(raw);
  // Handle both raw PrepareResult and envelope-wrapped
  if (parsed.data && parsed.data.transactions) {
    return parsed.data as PrepareResult;
  }
  if (parsed.transactions) {
    return parsed as PrepareResult;
  }
  throw usage("Invalid PrepareResult JSON: missing 'transactions' field");
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

/**
 * Verify every transaction targets a known Moonwell contract on the chain:
 *   - enter-market  → Comptroller
 *   - approve       → underlying token of some listed mToken
 *   - moonwell-*    → a listed mToken
 *
 * This prevents `submit` from being used as a generic raw-tx signer if the
 * action file or piped JSON is tampered with between prepare and submit.
 */
async function verifyMoonwellTargets(
  prepareResult: PrepareResult,
  publicClient: PublicClient<Transport, Chain>,
  chainId: number,
): Promise<void> {
  const contracts = getContracts(chainId);
  const comptrollerAddr = contracts.comptroller.toLowerCase();

  const markets = await publicClient.readContract({
    address: contracts.comptroller,
    abi: comptrollerAbi,
    functionName: "getAllMarkets",
  });

  const underlyings = await publicClient.multicall({
    contracts: (markets as Address[]).map((m) => ({
      address: m,
      abi: mTokenAbi,
      functionName: "underlying" as const,
    })),
    allowFailure: true,
  });

  const mTokenSet = new Set((markets as Address[]).map((m) => m.toLowerCase()));
  const underlyingSet = new Set<string>();
  for (const r of underlyings) {
    if (r.status === "success") {
      underlyingSet.add((r.result as string).toLowerCase());
    }
  }

  for (const tx of prepareResult.transactions) {
    const to = tx.to.toLowerCase();
    let valid = false;

    if (tx.step === "approve") {
      valid = underlyingSet.has(to);
    } else if (tx.step === "enter-market") {
      valid = to === comptrollerAddr;
    } else if (tx.step.startsWith("moonwell-")) {
      valid = mTokenSet.has(to);
    }

    if (!valid) {
      throw usage(
        `Refusing to sign: tx step "${tx.step}" targets ${tx.to}, ` +
        `which is not a known Moonwell contract on chain ${chainId}.`,
      );
    }
  }
}
