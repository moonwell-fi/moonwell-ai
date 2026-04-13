import type { Command } from "commander";
import { withReadCommand } from "../lib/command.js";
import { labelValue, c } from "../lib/format.js";
import { usage } from "../lib/errors.js";

export function registerTokenBalance(program: Command): void {
  program
    .command("token-balance")
    .description("Check ERC-20 token balances")
    .requiredOption("--address <addr>", "Account address")
    .option("--asset <symbol>", "Filter by asset symbol")
    .action(
      withReadCommand(program, "token-balance", "Fetching balances...", async ({ chain, client }, opts) => {
        if (!opts.address) throw usage("--address is required");

        const balances = await client.getUserBalances({
          userAddress: opts.address as `0x${string}`,
          chainId: chain.chainId,
        });

        let filtered = [...balances];
        if (opts.asset) {
          const sym = (opts.asset as string).toUpperCase();
          filtered = filtered.filter(
            (b) => b.token.symbol.toUpperCase() === sym,
          );
        }

        return {
          data: filtered.map((b) => ({
            token: b.token.symbol,
            address: b.token.address,
            balance: b.tokenBalance.value,
          })),
          pretty: () => {
            if (filtered.length === 0) {
              console.log(`  ${c.dim("No balances found")}`);
              return;
            }
            for (const b of filtered) {
              console.log(labelValue(b.token.symbol, b.tokenBalance.value.toString()));
            }
          },
        };
      }),
    );
}
