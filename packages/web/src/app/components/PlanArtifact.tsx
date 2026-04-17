const TRANSACTIONS = [
  { idx: '01', step: 'approve', desc: 'Approve token for Moonwell supply' },
  { idx: '02', step: 'moonwell-supply', desc: 'Supply asset to Moonwell' },
];

const PREVIEW: Array<[string, string]> = [
  ['asset', 'USDC'],
  ['amount', '100'],
  ['chain', 'base · 8453'],
  ['estimated APY', '2.92%'],
];

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted w-32 shrink-0">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}

export default function PlanArtifact() {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-background/60">
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <span className="ml-2 font-mono text-xs text-muted/60">moonwell-agent</span>
      </div>

      {/* Output */}
      <div className="px-5 py-4 font-mono text-sm space-y-3">
        {/* Command */}
        <div className="whitespace-nowrap overflow-x-auto">
          <span className="text-accent select-none" aria-hidden="true">❯ </span>
          <span className="text-foreground">moonwell supply </span>
          <span className="text-muted">--asset USDC --amount-decimal 100 --json</span>
        </div>

        {/* Header */}
        <div className="pt-1 space-y-1">
          <Field k="operation" v="supply" />
          <Field k="requirements" v={<span className="text-muted">Sufficient USDC balance · Gas for 2 tx</span>} />
        </div>

        {/* Transactions */}
        <div className="pt-1">
          <div className="text-muted">transactions</div>
          <ol className="mt-1 space-y-1">
            {TRANSACTIONS.map((t) => (
              <li key={t.idx} className="flex gap-2 ml-4">
                <span className="text-muted/70 select-none shrink-0" aria-hidden="true">{t.idx}</span>
                <span className="text-accent w-36 shrink-0">{t.step}</span>
                <span className="text-muted hidden sm:inline">{t.desc}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Preview */}
        <div className="pt-1">
          <div className="text-muted">preview</div>
          <div className="mt-1 space-y-1">
            {PREVIEW.map(([k, v]) => (
              <div key={k} className="flex gap-2 ml-4">
                <span className="text-muted w-28 shrink-0">{k}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation + warnings */}
        <div className="pt-1 space-y-1">
          <Field
            k="simulation"
            v={
              <>
                <span className="text-green select-none" aria-hidden="true">✓</span>
                <span className="ml-2">success</span>
                <span className="text-muted"> · 185,000 gas</span>
              </>
            }
          />
          <Field k="warnings" v={<span className="text-muted">none</span>} />
        </div>
      </div>
    </div>
  );
}
