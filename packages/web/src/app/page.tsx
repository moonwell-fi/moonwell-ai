import CopySkillButton from './components/CopySkillButton';
import CopyButton from './components/CopyButton';

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
  "Check my health factor on Moonwell",
  "Borrow 20 USDC against my collateral",
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <span className="font-mono text-sm text-muted">~/</span> */}
            <span className="font-mono text-base font-semibold"><span className="text-accent">agents</span>.moonwell.fi</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="#capabilities" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">Capabilities</a>
            <a href="#install" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">Install</a>
            <a href="https://github.com/moonwell-fi/moonwell-ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-150 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent focus-visible:text-foreground">GitHub</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-20 pb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center max-w-3xl leading-[1.15]">
          Give your agent DeFi<br />
          superpowers with{" "}<span className="text-accent">Moonwell</span>
        </h1>
        <div className="mt-8 flex items-center space-x-4">
          <CopySkillButton />
          <a
            href="#capabilities"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            See capabilities <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Agent session terminal card */}
        <div className="w-full max-w-2xl mt-10">
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-background">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <span className="ml-2 font-mono text-xs text-muted/60">moonwell-agent</span>
            </div>
            <div className="px-5 py-4 font-mono text-sm space-y-2">
              <div>
                <span className="text-accent">❯</span>
                <span className="text-foreground ml-2">check my yield opportunities on moonwell</span>
              </div>
              <div className="text-muted ml-4">↳ scanning Base markets...</div>
              <div className="space-y-1.5 ml-4 pt-1">
                <div className="flex gap-2">
                  <span className="text-green shrink-0">✓</span>
                  <span className="text-foreground w-14">USDC</span>
                  <span className="text-accent w-20">8.2% APY</span>
                  <span className="text-muted">$42M TVL</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green shrink-0">✓</span>
                  <span className="text-foreground w-14">ETH</span>
                  <span className="text-accent w-20">3.1% APY</span>
                  <span className="text-muted">$18M TVL</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green shrink-0">✓</span>
                  <span className="text-foreground w-14">cbBTC</span>
                  <span className="text-accent w-20">4.7% APY</span>
                  <span className="text-muted">$9M TVL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example prompts */}
      <section className="max-w-3xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <div
              key={prompt}
              className="border border-border rounded-lg px-4 py-3 font-mono text-sm hover:border-accent/40 transition-colors duration-150 cursor-default group"
            >
              <span className="text-accent">❯ </span>
              <span className="text-muted group-hover:text-foreground transition-colors">&ldquo;{prompt}&rdquo;</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card/50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 justify-center mb-10">
            <span className="font-mono text-xs text-muted/50">{"// "}</span>
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Install the skill", desc: "Give your agent (OpenClaw, Hermes, Claude Code) the skill to teach them how to use the Moonwell CLI." },
              { step: "2", title: "Prompt naturally", desc: "Ask your agent to check rates, supply tokens, or manage positions." },
              { step: "3", title: "Review & execute", desc: "The agent prepares unsigned transactions. You review and submit when ready." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="font-mono text-accent text-sm font-semibold mb-3">[{s.step}]</div>
                <h3 className="font-medium mb-1">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="flex items-center gap-2 justify-center mb-10">
          <span className="font-mono text-xs text-muted/50">{"// "}</span>
          <h2 className="text-2xl font-semibold tracking-tight">Capabilities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CAPABILITIES.map((group) => (
            <div key={group.category} className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-xs font-semibold text-muted uppercase tracking-wider">{group.category}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <ul className="space-y-3 font-mono">
                {group.items.map((item) => (
                  <li key={item.name} className="flex gap-2">
                    <span className="text-accent text-sm shrink-0">{">"}</span>
                    <div>
                      <span className="text-sm text-foreground">{item.name}</span>
                      <p className="text-xs text-muted mt-0.5 font-sans leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="border-t border-border bg-card/50 py-20">
        <div className="max-w-xl mx-auto px-6">
          <div className="flex items-center gap-2 justify-center mb-3">
            <span className="font-mono text-xs text-muted/50">{"// "}</span>
            <h2 className="text-2xl font-semibold tracking-tight">Install</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-mono text-xs font-medium text-muted uppercase tracking-wider mb-2">Share with your agent</h3>
              <div className="bg-card border border-border rounded-lg px-4 py-3 text-sm font-mono flex items-center gap-3">
                <span className="flex-1 overflow-x-auto">
                  <span className="text-muted">{">"} </span>curl
                  <span className="text-accent"> https://agents.moonwell.fi/skill.md</span>
                </span>
                <CopyButton text="curl https://agents.moonwell.fi/skill.md" />
              </div>
            </div>

            <div>
              <h3 className="font-mono text-xs font-medium text-muted uppercase tracking-wider mb-2">Or just install the CLI</h3>
              <div className="bg-card border border-border rounded-lg px-4 py-3 text-sm font-mono flex items-center gap-3">
                <span className="flex-1">
                  <span className="text-muted">$ </span><span className="text-foreground">npm install @moonwell-fi/cli</span>
                </span>
                <CopyButton text="npm install @moonwell-fi/cli" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
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
