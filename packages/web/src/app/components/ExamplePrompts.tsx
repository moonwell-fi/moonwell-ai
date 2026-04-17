'use client';

import { useEffect, useState } from 'react';
import { PROMPT_ORDER, RUN_SCRIPT_EVENT, SCRIPTS, dispatchRunScript } from '../lib/scripts';

export default function ExamplePrompts() {
  const [selected, setSelected] = useState<string>(PROMPT_ORDER[0]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id && id in SCRIPTS) setSelected(id);
    };
    window.addEventListener(RUN_SCRIPT_EVENT, handler);
    return () => window.removeEventListener(RUN_SCRIPT_EVENT, handler);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PROMPT_ORDER.map((id) => {
        const s = SCRIPTS[id];
        const isSelected = selected === s.id;
        return (
          <button
            key={s.id}
            onClick={() => {
              setSelected(s.id);
              dispatchRunScript(s.id);
            }}
            aria-pressed={isSelected}
            className={`text-left ${isSelected ? 'bg-card' : 'bg-card/50'} rounded-lg px-4 py-4 font-mono text-sm hover:bg-card transition-colors duration-150 cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
          >
            <span className="text-accent select-none" aria-hidden="true">❯ </span>
            <span
              className={`transition-colors duration-150 ${isSelected ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}
            >
              &ldquo;{s.prompt}&rdquo;
            </span>
          </button>
        );
      })}
    </div>
  );
}
