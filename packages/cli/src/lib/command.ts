import type { Command } from "commander";
import ora from "ora";
import type { ChainConfig } from "./chains.js";
import { resolveChain } from "./chains.js";
import { clientForChain } from "./moonwell.js";
import { isJsonMode, envelope, printJson, handleError } from "./output.js";
import { header, footer } from "./format.js";
import { exitCode } from "./errors.js";
import type { GlobalOptions } from "./types.js";

type MoonwellClient = ReturnType<typeof clientForChain>;

interface ReadContext {
  chain: ChainConfig;
  client: MoonwellClient;
  json: boolean;
  globalOpts: GlobalOptions;
}

/**
 * Shared wrapper for read commands. Handles chain resolution, SDK client
 * creation, spinner management, JSON/pretty branching, and error handling.
 *
 * @param commandName - used in JSON envelope and error reporting
 * @param spinnerText - loading message
 * @param handler - receives context, returns { data, pretty } where data is the
 *   JSON payload and pretty() prints the human-readable output
 */
export function withReadCommand(
  program: Command,
  commandName: string,
  spinnerText: string,
  handler: (
    ctx: ReadContext,
    opts: Record<string, unknown>,
  ) => Promise<{
    data: unknown;
    pretty: () => void;
  }>,
): (opts: Record<string, unknown>) => Promise<void> {
  return async (opts) => {
    const globalOpts = program.opts<GlobalOptions>();
    const json = isJsonMode(globalOpts.json);
    const spinner = json ? null : ora(spinnerText).start();

    let chainId = 8453; // default for error envelope
    try {
      const chain = resolveChain(globalOpts.chain ?? "base");
      chainId = chain.chainId;
      const client = clientForChain(chain, globalOpts.rpcUrl);

      const { data, pretty } = await handler(
        { chain, client, json, globalOpts },
        opts,
      );

      spinner?.stop();

      if (json) {
        printJson(envelope(commandName, chain.chainId, data));
      } else {
        console.log(header(`Moonwell ${commandName.charAt(0).toUpperCase() + commandName.slice(1)} \u2014 ${chain.name}`));
        pretty();
        console.log(footer());
      }
    } catch (err) {
      spinner?.fail(`Failed to fetch ${commandName}`);
      handleError(commandName, chainId, err, json);
      process.exit(exitCode(err));
    }
  };
}
