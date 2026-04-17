'use client';

import { PROMPT_ORDER, SCRIPTS, dispatchRunScript } from '../lib/scripts';

export default function ExamplePrompts() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PROMPT_ORDER.map((id) => {
        const s = SCRIPTS[id];
        return (
          <button
            key={s.id}
            onClick={() => dispatchRunScript(s.id)}
            className="text-left bg-card/50 rounded-lg px-4 py-4 font-mono text-sm hover:bg-card transition-colors duration-150 cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="text-accent select-none" aria-hidden="true">❯ </span>
            <span className="text-muted group-hover:text-foreground transition-colors duration-150">
              &ldquo;{s.prompt}&rdquo;
            </span>
          </button>
        );
      })}
    </div>
  );
}
