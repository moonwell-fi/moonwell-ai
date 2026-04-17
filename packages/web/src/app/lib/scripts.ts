export type ScriptRow = {
  cells: [string, string, string];
};

export type Script = {
  id: string;
  prompt: string;
  command: string;
  scanLine: string;
  rows: ScriptRow[];
};

export const SCRIPTS: Record<string, Script> = {
  yield: {
    id: 'yield',
    prompt: 'What are the best yield opportunities on Moonwell right now?',
    command: 'check my yield opportunities on moonwell',
    scanLine: 'scanning Base markets',
    rows: [
      { cells: ['USDC', '8.2% APY', '$42M TVL'] },
      { cells: ['ETH', '3.1% APY', '$18M TVL'] },
      { cells: ['cbBTC', '4.7% APY', '$9M TVL'] },
    ],
  },
  supply: {
    id: 'supply',
    prompt: 'Supply 50 USDC to Moonwell on Base',
    command: 'supply 50 USDC to moonwell on base',
    scanLine: 'preparing supply plan',
    rows: [
      { cells: ['approve', 'USDC', 'allowance set'] },
      { cells: ['enterMarkets', 'USDC', 'enabled as collateral'] },
      { cells: ['mint', '50 USDC', '~2.92% APY'] },
    ],
  },
  rates: {
    id: 'rates',
    prompt: 'Compare USDC supply rates on Base and Optimism',
    command: 'compare USDC supply rates on base and optimism',
    scanLine: 'fetching rates',
    rows: [
      { cells: ['base', '5.2% supply', '68% util'] },
      { cells: ['optimism', '4.8% supply', '72% util'] },
    ],
  },
  health: {
    id: 'health',
    prompt: 'Check my health factor on Moonwell',
    command: 'check my health factor on moonwell',
    scanLine: 'reading account position',
    rows: [
      { cells: ['supplied', '$1,240', ''] },
      { cells: ['borrowed', '$240', ''] },
      { cells: ['health', '4.58', 'healthy'] },
    ],
  },
  borrow: {
    id: 'borrow',
    prompt: 'Borrow 20 USDC against my collateral',
    command: 'borrow 20 USDC against my collateral',
    scanLine: 'preparing borrow plan',
    rows: [
      { cells: ['collateral', '$1,100', 'available'] },
      { cells: ['borrow', '20 USDC', '8.1% APR'] },
      { cells: ['health after', '4.12', 'still healthy'] },
    ],
  },
  rewards: {
    id: 'rewards',
    prompt: 'Show my pending WELL rewards',
    command: 'show my pending WELL rewards',
    scanLine: 'reading reward streams',
    rows: [
      { cells: ['USDC market', '12.3 WELL', '~$4.80'] },
      { cells: ['ETH market', '3.1 WELL', '~$1.20'] },
      { cells: ['total', '15.4 WELL', '~$6.00'] },
    ],
  },
};

export const PROMPT_ORDER: ReadonlyArray<keyof typeof SCRIPTS> = [
  'yield',
  'supply',
  'rates',
  'health',
  'borrow',
  'rewards',
];

export const RUN_SCRIPT_EVENT = 'moonwell:run-script';

export function dispatchRunScript(id: string) {
  window.dispatchEvent(new CustomEvent(RUN_SCRIPT_EVENT, { detail: id }));
}
