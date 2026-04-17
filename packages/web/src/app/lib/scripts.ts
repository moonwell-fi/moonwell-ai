export type OutputColor = 'foreground' | 'accent' | 'muted' | 'green' | 'orange' | 'red';

export type OutputRow =
  | { type: 'cmd'; text: string }
  | { type: 'header'; text: string }
  | { type: 'asset'; text: string }
  | { type: 'kv'; key: string; value: string; valueColor?: OutputColor }
  | { type: 'kvkv'; k1: string; v1: string; k2: string; v2: string }
  | { type: 'step'; name: string; desc: string }
  | { type: 'dim'; text: string }
  | { type: 'blank' };

export type Script = {
  id: string;
  prompt: string;
  command: string;
  scanLine: string;
  rows: OutputRow[];
};

export const SCRIPTS: Record<string, Script> = {
  yield: {
    id: 'yield',
    prompt: 'What are the best yield opportunities on Moonwell right now?',
    command: 'moonwell yield --sort apy --limit 3',
    scanLine: 'Fetching yield opportunities',
    rows: [
      { type: 'asset', text: 'USDC' },
      { type: 'kvkv', k1: 'Supply APY', v1: '8.23%', k2: 'TVL', v2: '$42M' },
      { type: 'blank' },
      { type: 'asset', text: 'cbBTC' },
      { type: 'kvkv', k1: 'Supply APY', v1: '4.71%', k2: 'TVL', v2: '$9M' },
      { type: 'blank' },
      { type: 'asset', text: 'ETH' },
      { type: 'kvkv', k1: 'Supply APY', v1: '3.12%', k2: 'TVL', v2: '$18M' },
    ],
  },
  supply: {
    id: 'supply',
    prompt: 'Supply 50 USDC to Moonwell on Base',
    command: 'moonwell supply --asset USDC --amount-decimal 50 --from 0x...',
    scanLine: 'Preparing supply',
    rows: [
      { type: 'header', text: 'Supply — Base' },
      { type: 'kv', key: 'Asset', value: '50 USDC' },
      { type: 'kv', key: 'Est. APY', value: '2.92%' },
      { type: 'kv', key: 'Steps', value: '2' },
      { type: 'blank' },
      { type: 'step', name: 'approve', desc: 'Approve token for Moonwell supply' },
      { type: 'step', name: 'moonwell-supply', desc: 'Supply asset to Moonwell' },
      { type: 'blank' },
      { type: 'kv', key: 'Simulation', value: 'Passed (gas: 185,000)', valueColor: 'green' },
    ],
  },
  rates: {
    id: 'rates',
    prompt: 'Compare USDC supply rates on Base and Optimism',
    command: 'moonwell rates --asset USDC --chain base',
    scanLine: 'Fetching rates',
    rows: [
      { type: 'asset', text: 'USDC · base' },
      { type: 'kv', key: 'Supply APY', value: '5.23%' },
      { type: 'kv', key: 'Borrow APY', value: '8.12%' },
      { type: 'kv', key: 'Utilization', value: '68.00%' },
      { type: 'blank' },
      { type: 'cmd', text: 'moonwell rates --asset USDC --chain optimism' },
      { type: 'asset', text: 'USDC · optimism' },
      { type: 'kv', key: 'Supply APY', value: '4.82%' },
      { type: 'kv', key: 'Borrow APY', value: '7.63%' },
      { type: 'kv', key: 'Utilization', value: '72.00%' },
    ],
  },
  health: {
    id: 'health',
    prompt: 'Check my health factor on Moonwell',
    command: 'moonwell health --address 0x...',
    scanLine: 'Checking account health',
    rows: [
      { type: 'kv', key: 'Address', value: '0x1234...abcd' },
      { type: 'kv', key: 'Total Supplied', value: '$1,240.00' },
      { type: 'kv', key: 'Total Borrowed', value: '$240.00' },
      { type: 'kv', key: 'Adj. Collateral', value: '$1,100.00' },
      { type: 'kv', key: 'Health Factor', value: '4.58', valueColor: 'green' },
      { type: 'kv', key: 'Markets', value: '3' },
    ],
  },
  borrow: {
    id: 'borrow',
    prompt: 'Borrow 20 USDC against my collateral',
    command: 'moonwell borrow --asset USDC --amount-decimal 20 --from 0x...',
    scanLine: 'Preparing borrow',
    rows: [
      { type: 'header', text: 'Borrow — Base' },
      { type: 'kv', key: 'Asset', value: '20 USDC' },
      { type: 'kv', key: 'Est. APY', value: '8.12%' },
      { type: 'kv', key: 'Steps', value: '1' },
      { type: 'blank' },
      { type: 'step', name: 'moonwell-borrow', desc: 'Borrow asset from Moonwell' },
      { type: 'blank' },
      { type: 'kv', key: 'Simulation', value: 'Passed (gas: 142,000)', valueColor: 'green' },
    ],
  },
  rewards: {
    id: 'rewards',
    prompt: 'Show my pending WELL rewards',
    command: 'moonwell rewards --address 0x...',
    scanLine: 'Fetching rewards',
    rows: [
      { type: 'asset', text: 'USDC → WELL' },
      { type: 'kv', key: 'Supply Rewards', value: '$4.80' },
      { type: 'kv', key: 'Borrow Rewards', value: '$0.00' },
      { type: 'blank' },
      { type: 'asset', text: 'ETH → WELL' },
      { type: 'kv', key: 'Supply Rewards', value: '$1.20' },
      { type: 'kv', key: 'Borrow Rewards', value: '$0.00' },
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
