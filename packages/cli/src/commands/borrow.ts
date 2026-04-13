import type { Command } from "commander";
import { executeLendCommand } from "./supply.js";

export function registerBorrow(program: Command): void {
  program
    .command("borrow")
    .description("Prepare a borrow transaction")
    .requiredOption("--asset <symbol>", "Underlying asset to borrow")
    .option("--amount <units>", "Amount in base units")
    .option("--amount-decimal <n>", "Amount in human-readable decimals")
    .requiredOption("--from <addr>", "Account address")
    .option("--pool-address <addr>", "Override mToken address")
    .option("--no-simulate", "Skip simulation")
    .action(async (opts) => {
      await executeLendCommand("borrow", opts, program);
    });
}
