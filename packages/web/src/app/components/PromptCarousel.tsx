'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PROMPT_ORDER, RUN_SCRIPT_EVENT, SCRIPTS, dispatchRunScript } from '../lib/scripts';

const ROTATE_MS = 4000;

export default function PromptCarousel() {
  const defaultId = (PROMPT_ORDER.includes('yield' as (typeof PROMPT_ORDER)[number]) ? 'yield' : PROMPT_ORDER[0]) as string;
  const [index, setIndex] = useState<number>(() => {
    const i = PROMPT_ORDER.indexOf(defaultId as (typeof PROMPT_ORDER)[number]);
    return i >= 0 ? i : 0;
  });
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentId = PROMPT_ORDER[index] as string;
  const current = SCRIPTS[currentId];

  // Rotation
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % PROMPT_ORDER.length);
    }, ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  // External run-script sync — keep the displayed prompt aligned with terminal state
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (!id) return;
      const i = PROMPT_ORDER.indexOf(id as (typeof PROMPT_ORDER)[number]);
      if (i >= 0) setIndex(i);
    };
    window.addEventListener(RUN_SCRIPT_EVENT, handler);
    return () => window.removeEventListener(RUN_SCRIPT_EVENT, handler);
  }, []);

  const activate = () => {
    dispatchRunScript(currentId);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Try prompt: ${current.prompt}`}
      onClick={activate}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative bg-card/60 hover:bg-card rounded-lg px-5 py-5 font-mono text-sm cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent overflow-hidden"
    >
      <div className="flex items-start gap-2 min-h-[1.5rem]">
        <span className="text-accent select-none shrink-0" aria-hidden="true">❯ </span>
        <div className="relative flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={transition}
              aria-live="polite"
              className="block text-foreground"
            >
              {current.prompt}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
