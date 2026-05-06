import TerminalCard from './TerminalCard';

const PROMPT = 'Borrow 200 USDC against my collateral if my health stays above 3';
const SCAN = 'Reading position, simulating borrow…';

const POSITION_ROWS: Array<[string, string]> = [
  ['Total Supplied', '$1,240.00'],
  ['Collateral', 'USDS, cbXRP, ETH'],
];

const SIMULATION_ROWS: Array<[string, string, string?]> = [
  ['Borrow APY', '3.89%'],
  ['Simulation', 'Passed (gas: 292,136)', 'text-green'],
  ['Health (after)', '3.91 — within your bound', 'text-green'],
  ['Awaiting', 'your signature'],
];

export default function AgentBankingArtifact() {
  return (
    <TerminalCard>
      <div className="px-5 py-4 font-mono text-sm space-y-0.5">
        <div className="leading-6 pl-[2ch] -indent-[2ch] mb-2">
          <span className="text-accent select-none" aria-hidden="true">❯ </span>
          <span className="text-foreground">{PROMPT}</span>
        </div>

        <div className="text-muted pl-4 mb-2">
          <span className="select-none" aria-hidden="true">↳ </span>
          {SCAN}
        </div>

        <div className="pl-2 text-foreground font-semibold">Position — Base</div>
        {POSITION_ROWS.map(([k, v]) => (
          <div key={k} className="flex gap-3 pl-4">
            <span className="text-accent w-36 shrink-0">{k}</span>
            <span className="text-foreground">{v}</span>
          </div>
        ))}

        <div>&nbsp;</div>

        <div className="pl-2 text-foreground font-semibold">Plan — Borrow 200 USDC</div>
        <div className="flex gap-2 pl-4">
          <span className="text-accent shrink-0">moonwell-borrow</span>
          <span className="text-muted select-none shrink-0" aria-hidden="true">—</span>
          <span className="text-muted">Borrow asset from Moonwell</span>
        </div>

        <div>&nbsp;</div>

        {SIMULATION_ROWS.map(([k, v, color]) => (
          <div key={k} className="flex gap-3 pl-4">
            <span className="text-accent w-36 shrink-0">{k}</span>
            <span className={color ?? 'text-foreground'}>{v}</span>
          </div>
        ))}
      </div>
    </TerminalCard>
  );
}
