import { Check } from 'lucide-react';

const TRANSACTIONS = [
  { idx: '01', step: 'approve', desc: 'Approve token for Moonwell supply' },
  { idx: '02', step: 'moonwell-supply', desc: 'Supply asset to Moonwell' },
];

const PREVIEW: Array<[string, string]> = [
  ['asset', 'USDC'],
  ['amount', '100'],
  ['chain', 'Base · 8453'],
  ['estimated APY', '2.92%'],
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
      {children}
    </span>
  );
}

export default function PlanArtifact() {
  return (
    <div className="bg-card/60 rounded-xl p-6 sm:p-8 font-mono text-sm">
      {/* Header */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-6 border-b border-border/60">
        <div>
          <Label>operation</Label>
          <p className="mt-1 text-foreground">supply</p>
        </div>
        <div>
          <Label>requirements</Label>
          <p className="mt-1 text-muted">Sufficient USDC balance · Gas for 2 tx</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="pt-6">
        <Label>transactions</Label>
        <ol className="mt-3 space-y-2">
          {TRANSACTIONS.map((t) => (
            <li key={t.idx} className="flex gap-4 items-baseline">
              <span className="text-muted/70 select-none shrink-0" aria-hidden="true">{t.idx}</span>
              <span className="text-accent w-36 shrink-0">{t.step}</span>
              <span className="text-muted font-sans text-[13px] leading-relaxed">{t.desc}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Preview + simulation */}
      <div className="mt-6 pt-6 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label>preview</Label>
          <dl className="mt-3 space-y-1.5">
            {PREVIEW.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="text-muted w-28 shrink-0">{k}</dt>
                <dd className="text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <Label>simulation</Label>
          <p className="mt-3 flex items-center gap-2">
            <Check size={14} strokeWidth={2.25} className="text-green" aria-hidden="true" />
            <span className="text-foreground">success</span>
            <span className="text-muted">·</span>
            <span className="text-muted">185,000 gas</span>
          </p>
          <Label>warnings</Label>
          <p className="mt-2 text-muted">none</p>
        </div>
      </div>
    </div>
  );
}
