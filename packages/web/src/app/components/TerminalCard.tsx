export default function TerminalCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-background/60">
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden="true" />
        <span className="ml-2 font-mono text-xs text-muted/60">moonwell-agent</span>
      </div>
      {children}
    </div>
  );
}
