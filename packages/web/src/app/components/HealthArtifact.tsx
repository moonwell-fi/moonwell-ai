import TerminalCard from './TerminalCard';

const PROMPT = 'Check my health factor on Moonwell';

const FIELDS: Array<[string, string, string?]> = [
  ['Address', '0x1234...abcd'],
  ['Total Supplied', '$1,240.00'],
  ['Total Borrowed', '$240.00'],
  ['Adj. Collateral', '$1,100.00'],
  ['Health Factor', '4.58', 'text-green'],
  ['Markets', '3'],
];

const THRESHOLDS: Array<[string, string, string]> = [
  ['> 1.5', 'healthy', 'text-green'],
  ['1.1 – 1.5', 'caution', 'text-orange'],
  ['< 1.1', 'liquidation risk', 'text-red'],
];

export default function HealthArtifact() {
  return (
    <TerminalCard>
      <div className="px-5 py-4 font-mono text-sm space-y-0.5">
        <div className="leading-6 pl-[2ch] -indent-[2ch] mb-2">
          <span className="text-accent select-none" aria-hidden="true">❯ </span>
          <span className="text-foreground">{PROMPT}</span>
        </div>

        {FIELDS.map(([k, v, color]) => (
          <div key={k} className="flex gap-3 pl-4">
            <span className="text-accent w-36 shrink-0">{k}</span>
            <span className={color ?? 'text-foreground'}>{v}</span>
          </div>
        ))}

        <div>&nbsp;</div>

        <div className="text-muted pl-4">
          <span className="select-none" aria-hidden="true"># </span>
          thresholds
        </div>
        {THRESHOLDS.map(([range, label, color]) => (
          <div key={range} className="flex gap-3 pl-4">
            <span className="text-muted select-none w-4 shrink-0" aria-hidden="true">#</span>
            <span className={`w-24 shrink-0 ${color}`}>{range}</span>
            <span className="text-muted">{label}</span>
          </div>
        ))}
      </div>
    </TerminalCard>
  );
}
