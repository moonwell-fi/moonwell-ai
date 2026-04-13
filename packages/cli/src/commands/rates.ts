import type { Command } from "commander";
import type { Market } from "@moonwell-fi/moonwell-sdk";
import { withReadCommand } from "../lib/command.js";
import { assetHeader, labelValue } from "../lib/format.js";
import { formatPct } from "../lib/amount.js";

function utilization(m: Market): number {
  return m.totalSupplyUsd > 0 ? m.totalBorrowsUsd / m.totalSupplyUsd : 0;
}

export function registerRates(program: Command): void {
  program
    .command("rates")
    .description("Current supply and borrow rates with utilization")
    .option("--asset <symbol>", "Filter by asset symbol")
    .action(
      withReadCommand(program, "rates", "Fetching rates...", async ({ chain, client }, opts) => {
        const markets = await client.getMarkets({ chainId: chain.chainId });
        let filtered = [...markets];

        if (opts.asset) {
          const sym = (opts.asset as string).toUpperCase();
          filtered = filtered.filter(
            (m) => m.underlyingToken.symbol.toUpperCase() === sym,
          );
        }

        return {
          data: filtered.map((m) => ({
            asset: m.underlyingToken.symbol,
            baseSupplyApy: m.baseSupplyApy,
            baseBorrowApy: m.baseBorrowApy,
            totalSupplyApr: m.totalSupplyApr,
            totalBorrowApr: m.totalBorrowApr,
            utilization: utilization(m),
          })),
          pretty: () => {
            for (const m of filtered) {
              console.log(assetHeader(m.underlyingToken.symbol));
              console.log(labelValue("Supply APY", formatPct(m.baseSupplyApy)));
              console.log(labelValue("Borrow APY", formatPct(m.baseBorrowApy)));
              console.log(labelValue("Utilization", formatPct(utilization(m) * 100)));
              console.log("");
            }
          },
        };
      }),
    );
}
