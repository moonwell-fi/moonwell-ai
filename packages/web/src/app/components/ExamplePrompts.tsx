'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  PROMPT_ORDER,
  RUN_SCRIPT_EVENT,
  SCRIPTS,
  ScriptId,
  TERMINAL_READY_EVENT,
  dispatchRunScript,
  isScriptId,
} from '../lib/scripts';

export default function ExamplePrompts() {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<ScriptId>(PROMPT_ORDER[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hot-reload fallback: terminal may finish before this mounts.
    const fallback = setTimeout(() => setReady(true), 6000);
    const handler = () => {
      setReady(true);
      clearTimeout(fallback);
    };
    window.addEventListener(TERMINAL_READY_EVENT, handler);
    return () => {
      window.removeEventListener(TERMINAL_READY_EVENT, handler);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (isScriptId(id)) setSelected(id);
    };
    window.addEventListener(RUN_SCRIPT_EVENT, handler);
    return () => window.removeEventListener(RUN_SCRIPT_EVENT, handler);
  }, []);

  if (!ready) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PROMPT_ORDER.map((id, idx) => {
        const s = SCRIPTS[id];
        const isSelected = selected === s.id;
        return (
          <motion.button
            key={s.id}
            initial={reduceMotion ? false : { opacity: 0, y: 6, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.3, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }
            }
            onClick={() => {
              setSelected(s.id);
              dispatchRunScript(s.id);
            }}
            aria-pressed={isSelected}
            className={`text-left ${
              isSelected ? 'bg-card' : 'bg-card/50'
            } rounded-md px-4 py-2.5 font-mono text-sm hover:bg-card transition-colors duration-150 cursor-pointer group focus-ring-btn`}
          >
            <span className="text-accent select-none" aria-hidden="true">❯ </span>
            <span
              className={`transition-colors duration-150 ${
                isSelected ? 'text-foreground' : 'text-muted group-hover:text-foreground'
              }`}
            >
              {s.prompt}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
