// Natural-language prompt shown to the reader. The agent translates this
// into: moonwell supply --asset USDC --amount-decimal 100 --from 0x... --chain base
const PROMPT = 'Supply 100 USDC to Moonwell on Base';

const SUMMARY: Array<[string, string]> = [
  ['Asset', '100 USDC'],
  ['mToken', '0xEdc8...6c22'],
  ['Est. APY', '2.92%'],
  ['Steps', '2'],
];

const STEPS: Array<[string, string]> = [
  ['approve', 'Approve token for Moonwell supply'],
  ['moonwell-supply', 'Supply asset to Moonwell'],
];

function KV({ k, v, color = 'text-foreground' }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex gap-3 pl-4">
      <span className="text-accent w-32 shrink-0">{k}</span>
      <span className={color}>{v}</span>
    </div>
  );
}

export default function PlanArtifact() {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-background/60">
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <span className="ml-2 font-mono text-xs text-muted/60">moonwell-agent</span>
      </div>

      <div className="px-5 py-4 font-mono text-sm space-y-0.5">
        <div className="leading-6 pl-[2ch] -indent-[2ch] mb-2">
          <span className="text-accent select-none" aria-hidden="true">❯ </span>
          <span className="text-foreground">{PROMPT}</span>
        </div>

        <div className="pl-2 text-foreground font-semibold mb-1">Supply — Base</div>

        {SUMMARY.map(([k, v]) => (
          <KV key={k} k={k} v={v} />
        ))}

        <div>&nbsp;</div>

        {STEPS.map(([name, desc]) => (
          <div key={name} className="flex gap-2 pl-4">
            <span className="text-accent shrink-0">{name}</span>
            <span className="text-muted select-none shrink-0" aria-hidden="true">—</span>
            <span className="text-muted">{desc}</span>
          </div>
        ))}

        <div>&nbsp;</div>

        <KV k="Simulation" v="Passed (gas: 185,000)" color="text-green" />
      </div>
    </div>
  );
}
