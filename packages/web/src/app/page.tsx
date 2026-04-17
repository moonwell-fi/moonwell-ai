import CopySkillButton from './components/CopySkillButton';
import CopyButton from './components/CopyButton';
import TerminalDemo from './components/TerminalDemo';
import LunarTerrain from './components/LunarTerrainMount';
import PlanArtifact from './components/PlanArtifact';

const CAPABILITIES = [
  { category: "Read", items: [
    { name: "markets", desc: "List all lending markets with APY, TVL, utilization" },
    { name: "rates", desc: "Current supply and borrow rates" },
    { name: "positions", desc: "Account supply, borrow, and collateral positions" },
    { name: "yield", desc: "Yield opportunities sorted by APY" },
    { name: "health", desc: "Account health factor and liquidation risk" },
    { name: "rewards", desc: "Pending WELL token rewards" },
    { name: "token-balance", desc: "ERC-20 token balances" },
  ]},
  { category: "Write", items: [
    { name: "supply", desc: "Prepare a deposit transaction" },
    { name: "withdraw", desc: "Prepare a withdrawal transaction" },
    { name: "borrow", desc: "Prepare a borrow transaction" },
    { name: "repay", desc: "Prepare a loan repayment transaction" },
  ]},
  { category: "Execute", items: [
    { name: "submit", desc: "Sign and broadcast prepared transactions on-chain" },
  ]},
];

const EXAMPLE_PROMPTS = [
  "What are the best yield opportunities on Moonwell right now?",
  "Supply 50 USDC to Moonwell on Base",
  "Compare USDC supply rates on Base and Optimism",
  "Check my health factor on Moonwell",
  "Borrow 20 USDC against my collateral",
  "Show my pending WELL rewards",
];

const STEPS = [
  { step: "01", title: "Install the skill", desc: "Point your agent (Claude Code, Cursor, Hermes) at the skill file." },
  { step: "02", title: "Prompt naturally", desc: "Ask about rates, supply tokens, manage positions in plain language." },
  { step: "03", title: "Review & sign", desc: "Write commands return an unsigned plan with simulation and preview. Pipe to submit, or sign when ready." },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono text-sm font-medium">
            <span className="text-accent">agents</span>.moonwell.fi
          </span>
          <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted">
            <a href="#capabilities" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">Capabilities</a>
            <a href="#install" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">Install</a>
            <a href="https://github.com/moonwell-fi/moonwell-ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">GitHub</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <LunarTerrain />
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.04em] text-center max-w-4xl leading-[1.02]">
            Give your agent DeFi superpowers with{" "}
            <span className="text-accent">Moonwell</span>.
          </h1>
          <p className="mt-8 max-w-xl text-center text-lg leading-relaxed text-muted">
            A CLI and skill that lets any AI agent read Moonwell markets and prepare unsigned transactions. Simulated. Previewed. You sign.
          </p>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted/70">
            Base · Optimism · no keys required
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full max-w-sm sm:w-auto sm:max-w-none">
            <CopySkillButton />
            <a
              href="#capabilities"
              className="inline-flex items-center justify-center sm:justify-start gap-1 text-sm font-medium text-muted hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground"
            >
              See capabilities <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* Agent session terminal card — as editorial artifact */}
          <div className="w-full max-w-2xl mt-16">
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-background/60">
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="ml-2 font-mono text-xs text-muted/60">moonwell-agent</span>
              </div>
              <TerminalDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Example prompts */}
      <section className="max-w-3xl mx-auto px-6 pb-24 w-full">
        <div className="mb-6">
          <Eyebrow>Try asking</Eyebrow>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <div
              key={prompt}
              className="bg-card/50 rounded-lg px-4 py-4 font-mono text-sm hover:bg-card transition-colors duration-150 cursor-default group"
            >
              <span className="text-accent select-none" aria-hidden="true">❯ </span>
              <span className="text-muted group-hover:text-foreground transition-colors duration-150">&ldquo;{prompt}&rdquo;</span>
            </div>
          ))}
        </div>
      </section>

      {/* The plan artifact */}
      <section className="max-w-3xl mx-auto px-6 pb-24 w-full">
        <div className="mb-6">
          <Eyebrow>The plan</Eyebrow>
        </div>
        <p className="text-muted text-[15px] leading-relaxed mb-6 max-w-xl">
          Every write command returns a structured, unsigned plan — ordered transactions, preview, simulation, and warnings — for the agent or you to inspect before signing.
        </p>
        <PlanArtifact />
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card/30 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-14">
            <Eyebrow>How it works</Eyebrow>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="space-y-3">
                <div className="font-mono text-accent text-xs tracking-[0.2em]">{s.step}</div>
                <h3 className="text-lg font-medium tracking-tight">{s.title}</h3>
                <p className="text-[15px] text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="max-w-5xl mx-auto px-6 py-24 w-full scroll-mt-16">
        <div className="mb-10">
          <Eyebrow>Capabilities</Eyebrow>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CAPABILITIES.map((group) => (
            <div key={group.category} className="bg-card/60 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.2em]">{group.category}</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <ul className="space-y-4 font-mono">
                {group.items.map((item) => (
                  <li key={item.name} className="flex gap-2">
                    <span className="text-accent text-sm shrink-0 select-none" aria-hidden="true">{">"}</span>
                    <div>
                      <span className="text-sm text-foreground">{item.name}</span>
                      <p className="text-xs text-muted mt-1 font-sans leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="border-t border-border bg-card/30 py-24 scroll-mt-16">
        <div className="max-w-xl mx-auto px-6">
          <div className="mb-10">
            <Eyebrow>Install</Eyebrow>
          </div>
          <div className="space-y-8">
            <div>
              <h3 className="font-mono text-[11px] font-medium text-muted uppercase tracking-[0.2em] mb-3">Share with your agent</h3>
              <div className="bg-card border border-border/60 rounded-lg px-4 py-3.5 text-sm font-mono flex items-center gap-3">
                <span className="flex-1 overflow-x-auto">
                  <span className="text-muted select-none" aria-hidden="true">$ </span>
                  <span className="text-foreground">curl</span>
                  <span className="text-accent"> https://agents.moonwell.fi/skill.md</span>
                </span>
                <CopyButton text="curl https://agents.moonwell.fi/skill.md" />
              </div>
            </div>

            <div>
              <h3 className="font-mono text-[11px] font-medium text-muted uppercase tracking-[0.2em] mb-3">Or install the CLI</h3>
              <div className="bg-card border border-border/60 rounded-lg px-4 py-3.5 text-sm font-mono flex items-center gap-3">
                <span className="flex-1">
                  <span className="text-muted select-none" aria-hidden="true">$ </span><span className="text-foreground">npm install @moonwell-fi/cli</span>
                </span>
                <CopyButton text="npm install @moonwell-fi/cli" />
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-border/40">
              <h3 className="font-mono text-[11px] font-medium text-muted uppercase tracking-[0.2em] mb-3 mt-4">
                <span className="select-none" aria-hidden="true">↳ </span>
                Then prepare &amp; submit in one pipe
              </h3>
              <div className="bg-card border border-border/60 rounded-lg px-4 py-3.5 text-sm font-mono flex items-start gap-3">
                <span className="flex-1 leading-6">
                  <span className="text-muted select-none" aria-hidden="true">$ </span>
                  <span className="text-foreground">moonwell supply --asset USDC --amount-decimal 50 --json </span>
                  <span className="text-muted">| </span>
                  <span className="text-foreground">moonwell submit</span>
                </span>
                <CopyButton text="moonwell supply --asset USDC --amount-decimal 50 --json | moonwell submit" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span className="font-mono">agents.moonwell.fi</span>
          <div className="flex gap-6">
            <a href="https://moonwell.fi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">Moonwell</a>
            <a href="https://github.com/moonwell-fi/moonwell-ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">GitHub</a>
            <a href="/skill.md" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">Skill</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
