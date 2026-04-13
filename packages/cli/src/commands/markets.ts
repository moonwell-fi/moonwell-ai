import type { Command } from "commander";
import type { Market } from "@moonwell-fi/moonwell-sdk";
import { withReadCommand } from "../lib/command.js";
import { assetHeader, labelValuePair, labelValue } from "../lib/format.js";
import { formatUsd, formatPct } from "../lib/amount.js";

function utilization(m: Market): number {
  return m.totalSupplyUsd > 0 ? m.totalBorrowsUsd / m.totalSupplyUsd : 0;
}

export function registerMarkets(program: Command): void {
  program
    .command("markets")
    .description("List all Moonwell lending markets with rates and TVL")
    .option("--asset <symbol>", "Filter by asset symbol")
    .option("--sort <key>", "Sort by: tvl, supply-apy, borrow-apy", "tvl")
    .option("--limit <n>", "Max results")
    .action(
      withReadCommand(program, "markets", "Fetching Moonwell markets...", async ({ chain, client }, opts) => {
        const markets = await client.getMarkets({ chainId: chain.chainId });
        let filtered = [...markets];

        if (opts.asset) {
          const sym = (opts.asset as string).toUpperCase();
          filtered = filtered.filter(
            (m) =>
              m.underlyingToken.symbol.toUpperCase() === sym ||
              m.marketToken.symbol.toUpperCase() === sym,
          );
        }

        const sortKey = (opts.sort as string) ?? "tvl";
        filtered.sort((a, b) => {
          switch (sortKey) {
            case "supply-apy":
              return b.baseSupplyApy - a.baseSupplyApy;
            case "borrow-apy":
              return a.baseBorrowApy - b.baseBorrowApy;
            default:
              return b.totalSupplyUsd - a.totalSupplyUsd;
          }
        });

        if (opts.limit) {
          filtered = filtered.slice(0, parseInt(opts.limit as string, 10));
        }

        return {
          data: filtered.map(marketToJson),
          pretty: () => {
            for (const m of filtered) {
              printMarketPretty(m);
            }
          },
        };
      }),
    );
}

function marketToJson(m: Market): Record<string, unknown> {
  return {
    asset: m.underlyingToken.symbol,
    assetAddress: m.underlyingToken.address,
    mToken: m.marketToken.symbol,
    mTokenAddress: m.marketToken.address,
    baseSupplyApy: m.baseSupplyApy,
    baseBorrowApy: m.baseBorrowApy,
    totalSupplyApr: m.totalSupplyApr,
    totalBorrowApr: m.totalBorrowApr,
    totalSupplyUsd: m.totalSupplyUsd,
    totalBorrowsUsd: m.totalBorrowsUsd,
    liquidityUsd: m.totalSupplyUsd - m.totalBorrowsUsd,
    utilization: utilization(m),
    collateralFactor: m.collateralFactor,
  };
}

function printMarketPretty(m: Market): void {
  console.log(assetHeader(m.underlyingToken.symbol));
  console.log(
    labelValuePair(
      "Supply APY",
      formatPct(m.baseSupplyApy),
      "Borrow APY",
      formatPct(m.baseBorrowApy),
    ),
  );
  console.log(
    labelValuePair(
      "TVL",
      formatUsd(m.totalSupplyUsd),
      "Liquidity",
      formatUsd(m.totalSupplyUsd - m.totalBorrowsUsd),
    ),
  );
  console.log(labelValue("Utilization", formatPct(utilization(m) * 100)));
  console.log("");
}
