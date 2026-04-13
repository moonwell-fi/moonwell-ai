import type { Command } from "commander";
import { withReadCommand } from "../lib/command.js";
import { labelValue, c } from "../lib/format.js";
import { formatUsd } from "../lib/amount.js";
import { usage } from "../lib/errors.js";

export function registerHealth(program: Command): void {
  program
    .command("health")
    .description("Account health and liquidity overview")
    .requiredOption("--address <addr>", "Account address")
    .action(
      withReadCommand(program, "health", "Checking account health...", async ({ chain, client }, opts) => {
        if (!opts.address) throw usage("--address is required");

        const positions = await client.getUserPositions({
          userAddress: opts.address as `0x${string}`,
          chainId: chain.chainId,
        });

        let totalSupplyUsd = 0;
        let totalBorrowUsd = 0;
        let totalCollateralUsd = 0;

        for (const p of positions) {
          totalSupplyUsd += p.suppliedUsd;
          totalBorrowUsd += p.borrowedUsd;
          totalCollateralUsd += p.collateralUsd;
        }

        const healthFactor =
          totalBorrowUsd > 0 ? totalCollateralUsd / totalBorrowUsd : Infinity;

        const data = {
          address: opts.address,
          totalSupplyUsd,
          totalBorrowUsd,
          totalCollateralUsd,
          healthFactor: healthFactor === Infinity ? null : healthFactor,
          marketCount: positions.length,
        };

        return {
          data,
          pretty: () => {
            console.log(labelValue("Address", opts.address as string));
            console.log(labelValue("Total Supplied", formatUsd(totalSupplyUsd)));
            console.log(labelValue("Total Borrowed", formatUsd(totalBorrowUsd)));
            console.log(labelValue("Adj. Collateral", formatUsd(totalCollateralUsd)));

            const hfStr =
              healthFactor === Infinity
                ? c.positive("Safe (no borrows)")
                : healthFactor < 1.1
                  ? c.negative(healthFactor.toFixed(2))
                  : healthFactor < 1.5
                    ? c.warning(healthFactor.toFixed(2))
                    : c.positive(healthFactor.toFixed(2));
            console.log(labelValue("Health Factor", hfStr));
            console.log(labelValue("Markets", positions.length.toString()));
          },
        };
      }),
    );
}
