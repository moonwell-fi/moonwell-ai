import type { Command } from "commander";
import ora from "ora";
import { isAddress, getAddress, type Address } from "viem";
import { resolveChain } from "../lib/chains.js";
import { clientForChain } from "../lib/moonwell.js";
import { getViemClient } from "../lib/client.js";
import { resolveMToken } from "../lib/mtoken-resolver.js";
import { prepareLendAction } from "../lib/prepare.js";
import { isJsonMode, envelope, printJson, handleError } from "../lib/output.js";
import { header, footer, labelValue, c } from "../lib/format.js";
import { toBaseUnits, toDecimal } from "../lib/amount.js";
import { exitCode, usage } from "../lib/errors.js";
import type { GlobalOptions, PrepareResult } from "../lib/types.js";

interface LendOptions extends GlobalOptions {
  asset: string;
  amount?: string;
  amountDecimal?: string;
  from: string;
  poolAddress?: string;
  simulate: boolean;
}

export function registerSupply(program: Command): void {
  program
    .command("supply")
    .description("Prepare a supply (deposit) transaction")
    .requiredOption("--asset <symbol>", "Underlying asset to supply")
    .option("--amount <units>", "Amount in base units")
    .option("--amount-decimal <n>", "Amount in human-readable decimals")
    .requiredOption("--from <addr>", "Sender address")
    .option("--pool-address <addr>", "Override mToken address")
    .option("--no-simulate", "Skip simulation")
    .action(async (opts: LendOptions) => {
      await executeLendCommand("supply", opts, program);
    });
}

export async function executeLendCommand(
  verb: "supply" | "withdraw" | "borrow" | "repay",
  opts: LendOptions,
  program: Command,
): Promise<void> {
  const globalOpts = program.opts<GlobalOptions>();
  const json = isJsonMode(globalOpts.json);
  const spinner = json ? null : ora(`Preparing ${verb}...`).start();

  try {
    if (!opts.from || !isAddress(opts.from)) {
      throw usage("--from must be a valid Ethereum address");
    }
    if (!opts.amount && !opts.amountDecimal) {
      throw usage("Provide --amount (base units) or --amount-decimal");
    }

    const chain = resolveChain(globalOpts.chain ?? "base");
    const sdkClient = clientForChain(chain, globalOpts.rpcUrl);
    const viemClient = getViemClient(chain, globalOpts.rpcUrl);

    // Resolve asset from SDK markets
    const markets = await sdkClient.getMarkets({ chainId: chain.chainId });
    const market = markets.find(
      (m) =>
        m.underlyingToken.symbol.toUpperCase() ===
        opts.asset.toUpperCase(),
    );

    if (!market) {
      throw usage(
        `Asset "${opts.asset}" not found in Moonwell markets on ${chain.name}`,
      );
    }

    const assetAddress = getAddress(
      market.underlyingToken.address,
    ) as Address;
    const assetDecimals: number = market.underlyingToken.decimals;
    const assetSymbol: string = market.underlyingToken.symbol;

    // Resolve amount
    let amount: bigint;
    let amountDecimal: string;
    if (opts.amount) {
      amount = BigInt(opts.amount);
      amountDecimal = toDecimal(amount, assetDecimals);
    } else {
      amount = toBaseUnits(opts.amountDecimal!, assetDecimals);
      amountDecimal = opts.amountDecimal!;
    }

    // Resolve mToken — pass the SDK markets list as hints so we skip the
    // Comptroller.getAllMarkets() + multicall round-trip on the happy path.
    const marketHints = markets.map((m) => ({
      mTokenAddress: getAddress(m.marketToken.address) as Address,
      underlyingAddress: getAddress(m.underlyingToken.address) as Address,
    }));
    const mToken = await resolveMToken(
      viemClient,
      chain.chainId,
      assetAddress,
      opts.poolAddress,
      marketHints,
    );

    if (spinner) spinner.text = `Building ${verb} transaction...`;

    const result = await prepareLendAction({
      verb,
      chainId: chain.chainId,
      asset: assetSymbol,
      assetAddress,
      assetDecimals,
      amount,
      amountDecimal,
      from: getAddress(opts.from) as Address,
      mToken,
      viemClient,
      simulate: opts.simulate !== false,
      estimatedAPY: market.baseSupplyApy || undefined,
    });

    spinner?.stop();

    if (json) {
      printJson(envelope(verb, chain.chainId, result));
    } else {
      printPrepareResultPretty(result, chain.name);
    }
  } catch (err) {
    spinner?.fail(`Failed to prepare ${verb}`);
    const chainId = (() => { try { return resolveChain(globalOpts.chain ?? "base").chainId; } catch { return 0; } })();
    handleError(verb, chainId, err, json);
    process.exit(exitCode(err));
  }
}

function printPrepareResultPretty(result: PrepareResult, chainName: string): void {
  console.log(
    header(
      `${result.operation.charAt(0).toUpperCase() + result.operation.slice(1)} \u2014 ${chainName}`,
    ),
  );
  console.log(
    labelValue(
      "Asset",
      `${result.preview.amountDecimal} ${result.preview.asset}`,
    ),
  );
  console.log(labelValue("mToken", result.preview.mToken));
  if (result.preview.estimatedAPY != null) {
    console.log(
      labelValue("Est. APY", `${result.preview.estimatedAPY.toFixed(2)}%`),
    );
  }
  console.log(
    labelValue("Steps", result.transactions.length.toString()),
  );

  console.log("");
  for (const tx of result.transactions) {
    console.log(`    ${c.accent(tx.step)} \u2014 ${tx.description}`);
    console.log(`      ${c.dim("to:")} ${tx.to}`);
    console.log(
      `      ${c.dim("data:")} ${tx.data.slice(0, 20)}...`,
    );
  }

  if (result.warnings.length > 0) {
    console.log("");
    for (const w of result.warnings) {
      console.log(`  ${c.warning("\u26A0")} ${w}`);
    }
  }

  if (result.simulation) {
    console.log("");
    if (result.simulation.success) {
      console.log(
        labelValue(
          "Simulation",
          c.positive(`Passed (gas: ${result.simulation.gasEstimate})`),
        ),
      );
    } else {
      console.log(
        labelValue(
          "Simulation",
          c.negative(`Failed: ${result.simulation.error}`),
        ),
      );
    }
  }

  console.log(footer());
}
