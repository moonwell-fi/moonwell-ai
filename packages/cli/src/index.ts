import { Command } from "commander";
import { registerMarkets } from "./commands/markets.js";
import { registerRates } from "./commands/rates.js";
import { registerPositions } from "./commands/positions.js";
import { registerYield } from "./commands/yield.js";
import { registerHealth } from "./commands/health.js";
import { registerRewards } from "./commands/rewards.js";
import { registerTokenBalance } from "./commands/token-balance.js";
import { registerSupply } from "./commands/supply.js";
import { registerWithdraw } from "./commands/withdraw.js";
import { registerBorrow } from "./commands/borrow.js";
import { registerRepay } from "./commands/repay.js";
import { registerSubmit } from "./commands/submit.js";

const program = new Command();

program
  .name("moonwell")
  .description("Agent-first CLI for the Moonwell lending protocol")
  .version("0.1.0")
  .option("--chain <chain>", "Chain: base (default), optimism, 8453, 10", "base")
  .option("--rpc-url <url>", "Override RPC endpoint")
  .option("--json", "Force JSON output");

// Read commands
registerMarkets(program);
registerRates(program);
registerPositions(program);
registerYield(program);
registerHealth(program);
registerRewards(program);
registerTokenBalance(program);

// Write commands
registerSupply(program);
registerWithdraw(program);
registerBorrow(program);
registerRepay(program);
registerSubmit(program);

program.parse();
