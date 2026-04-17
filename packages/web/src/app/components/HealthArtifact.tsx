import { Check } from 'lucide-react';

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted w-32 shrink-0">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}

function LegendRow({ range, label, className }: { range: string; label: string; className: string }) {
  return (
    <div className="flex gap-3">
      <span className={`w-20 shrink-0 ${className}`}>{range}</span>
      <span className="text-muted">{label}</span>
    </div>
  );
}

export default function HealthArtifact() {
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
        <div className="leading-6 pl-[2ch] -indent-[2ch]">
          <span className="text-accent select-none" aria-hidden="true">❯ </span>
          <span className="text-foreground">moonwell health </span>
          <span className="text-muted">--address 0x...</span>
        </div>

        {/* Account summary */}
        <div className="pt-1 space-y-1">
          <Field k="supplied" v="$1,240.00" />
          <Field k="borrowed" v="$240.00" />
          <Field k="collateral" v="$1,100.00" />
        </div>

        {/* Health factor headline */}
        <div className="pt-2 flex items-baseline gap-3">
          <span className="text-muted w-32 shrink-0">health factor</span>
          <span className="text-green text-lg font-semibold">4.58</span>
          <span className="inline-flex items-center gap-1 text-green text-xs">
            <Check size={12} strokeWidth={2.5} aria-hidden="true" />
            healthy
          </span>
        </div>

        {/* Legend */}
        <div className="pt-1 text-xs space-y-1">
          <LegendRow range="> 1.5" label="healthy" className="text-green" />
          <LegendRow range="1.1 – 1.5" label="caution" className="text-orange" />
          <LegendRow range="< 1.1" label="liquidation risk" className="text-red" />
        </div>
      </div>
    </div>
  );
}
