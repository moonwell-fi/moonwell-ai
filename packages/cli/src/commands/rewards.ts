import type { Command } from "commander";
import { withReadCommand } from "../lib/command.js";
import { assetHeader, labelValue, c } from "../lib/format.js";
import { formatUsd } from "../lib/amount.js";
import { usage } from "../lib/errors.js";

export function registerRewards(program: Command): void {
  program
    .command("rewards")
    .description("View pending WELL rewards")
    .requiredOption("--address <addr>", "Account address")
    .action(
      withReadCommand(program, "rewards", "Fetching rewards...", async ({ chain, client }, opts) => {
        if (!opts.address) throw usage("--address is required");

        const rewards = await client.getUserRewards({
          userAddress: opts.address as `0x${string}`,
          chainId: chain.chainId,
        });

        return {
          data: rewards.map((r) => ({
            market: r.market.symbol,
            rewardToken: r.rewardToken.symbol,
            supplyRewardsUsd: r.supplyRewardsUsd,
            borrowRewardsUsd: r.borrowRewardsUsd,
          })),
          pretty: () => {
            if (rewards.length === 0) {
              console.log(`  ${c.dim("No pending rewards")}`);
              return;
            }
            for (const r of rewards) {
              console.log(assetHeader(`${r.market.symbol} \u2192 ${r.rewardToken.symbol}`));
              console.log(labelValue("Supply Rewards", formatUsd(r.supplyRewardsUsd)));
              console.log(labelValue("Borrow Rewards", formatUsd(r.borrowRewardsUsd)));
              console.log("");
            }
          },
        };
      }),
    );
}
