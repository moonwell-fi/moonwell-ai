import type { Command } from "commander";
import type { UserPosition } from "@moonwell-fi/moonwell-sdk";
import { withReadCommand } from "../lib/command.js";
import { assetHeader, labelValue, c } from "../lib/format.js";
import { formatUsd } from "../lib/amount.js";
import { usage } from "../lib/errors.js";

export function registerPositions(program: Command): void {
  program
    .command("positions")
    .description("View account lending positions")
    .requiredOption("--address <addr>", "Account address")
    .option("--asset <symbol>", "Filter by asset symbol")
    .option("--type <type>", "Filter: all, supply, borrow, collateral", "all")
    .option("--limit <n>", "Max results")
    .action(
      withReadCommand(program, "positions", "Fetching positions...", async ({ chain, client }, opts) => {
        if (!opts.address) throw usage("--address is required");

        const positions = await client.getUserPositions({
          userAddress: opts.address as `0x${string}`,
          chainId: chain.chainId,
        });

        let filtered = [...positions];

        if (opts.asset) {
          const sym = (opts.asset as string).toUpperCase();
          filtered = filtered.filter(
            (p) => p.market.symbol.toUpperCase() === sym,
          );
        }

        if (opts.limit) {
          filtered = filtered.slice(0, parseInt(opts.limit as string, 10));
        }

        return {
          data: filtered.map(positionToJson),
          pretty: () => {
            if (filtered.length === 0) {
              console.log(`  ${c.dim("No positions found")}`);
              return;
            }
            for (const p of filtered) {
              printPositionPretty(p);
            }
          },
        };
      }),
    );
}

function positionToJson(p: UserPosition): Record<string, unknown> {
  return {
    market: p.market.symbol,
    marketAddress: p.market.address,
    suppliedUsd: p.suppliedUsd,
    borrowedUsd: p.borrowedUsd,
    collateralUsd: p.collateralUsd,
    collateralEnabled: p.collateralEnabled,
  };
}

function printPositionPretty(p: UserPosition): void {
  console.log(assetHeader(p.market.symbol));
  if (p.suppliedUsd > 0) console.log(labelValue("Supplied", formatUsd(p.suppliedUsd)));
  if (p.borrowedUsd > 0) console.log(labelValue("Borrowed", formatUsd(p.borrowedUsd)));
  if (p.collateralEnabled) console.log(labelValue("Collateral", c.positive("Enabled")));
  console.log("");
}
