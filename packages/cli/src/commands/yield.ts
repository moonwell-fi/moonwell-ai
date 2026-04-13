import type { Command } from "commander";
import { withReadCommand } from "../lib/command.js";
import { assetHeader, labelValuePair } from "../lib/format.js";
import { formatUsd, formatPct } from "../lib/amount.js";

export function registerYield(program: Command): void {
  program
    .command("yield")
    .description("Yield opportunities sorted by supply APY")
    .option("--asset <symbol>", "Filter by asset symbol")
    .option("--sort <key>", "Sort by: apy, tvl", "apy")
    .option("--min-tvl <usd>", "Minimum TVL filter in USD")
    .option("--limit <n>", "Max results")
    .action(
      withReadCommand(program, "yield", "Fetching yield opportunities...", async ({ chain, client }, opts) => {
        const markets = await client.getMarkets({ chainId: chain.chainId });
        let filtered = [...markets];

        if (opts.asset) {
          const sym = (opts.asset as string).toUpperCase();
          filtered = filtered.filter(
            (m) => m.underlyingToken.symbol.toUpperCase() === sym,
          );
        }

        if (opts.minTvl) {
          const minTvl = parseFloat(opts.minTvl as string);
          filtered = filtered.filter((m) => m.totalSupplyUsd >= minTvl);
        }

        const sortKey = (opts.sort as string) ?? "apy";
        filtered.sort((a, b) =>
          sortKey === "tvl"
            ? b.totalSupplyUsd - a.totalSupplyUsd
            : b.baseSupplyApy - a.baseSupplyApy,
        );

        if (opts.limit) {
          filtered = filtered.slice(0, parseInt(opts.limit as string, 10));
        }

        return {
          data: filtered.map((m) => ({
            asset: m.underlyingToken.symbol,
            assetAddress: m.underlyingToken.address,
            baseSupplyApy: m.baseSupplyApy,
            totalSupplyApr: m.totalSupplyApr,
            totalSupplyUsd: m.totalSupplyUsd,
            collateralFactor: m.collateralFactor,
          })),
          pretty: () => {
            for (const m of filtered) {
              console.log(assetHeader(m.underlyingToken.symbol));
              console.log(
                labelValuePair(
                  "Supply APY",
                  formatPct(m.baseSupplyApy),
                  "TVL",
                  formatUsd(m.totalSupplyUsd),
                ),
              );
              console.log("");
            }
          },
        };
      }),
    );
}
