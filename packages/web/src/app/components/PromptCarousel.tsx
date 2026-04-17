'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROMPT_ORDER, SCRIPTS } from '../lib/scripts';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

const ROTATE_MS = 4000;
const COPIED_HOLD_MS = 1600;

export default function PromptCarousel() {
  const defaultIndex = Math.max(
    0,
    PROMPT_ORDER.indexOf('yield' as (typeof PROMPT_ORDER)[number])
  );
  const [index, setIndex] = useState<number>(defaultIndex);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentId = PROMPT_ORDER[index] as string;
  const current = SCRIPTS[currentId];

  const [copied, copy] = useCopyToClipboard(current.prompt, COPIED_HOLD_MS);

  useEffect(() => {
    // Pause rotation while feedback is visible so the user sees what they
    // actually copied.
    if (paused || copied) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % PROMPT_ORDER.length);
    }, ROTATE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, copied]);

  const activate = () => {
    copy();
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
      aria-label={copied ? `Copied prompt: ${current.prompt}` : `Copy prompt: ${current.prompt}`}
      onClick={activate}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative bg-card/60 hover:bg-card rounded-lg px-5 py-5 font-mono text-sm cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent overflow-hidden"
    >
      <div className="flex items-start gap-2 min-h-[1.5rem]">
        <span className="relative inline-flex w-4 h-5 items-center justify-center shrink-0 select-none" aria-hidden="true">
          <span
            className={`absolute text-accent transition-[opacity,transform,filter] duration-150 ease-out ${
              copied ? 'opacity-0 scale-90 blur-[2px]' : 'opacity-100 scale-100 blur-0'
            }`}
          >
            ❯
          </span>
          <span
            className={`absolute inline-flex text-green transition-[opacity,transform,filter] duration-150 ease-out ${
              copied ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-[2px]'
            }`}
          >
            <Check size={14} strokeWidth={2.25} />
          </span>
        </span>
        <div className="relative flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={transition}
              aria-live="polite"
              className={`block transition-colors duration-150 ${copied ? 'text-muted' : 'text-foreground'}`}
            >
              {current.prompt}
            </motion.span>
          </AnimatePresence>
        </div>
        <span
          className={`shrink-0 text-[10px] uppercase tracking-[0.22em] font-mono transition-[opacity,transform] duration-200 ${
            copied ? 'opacity-100 translate-x-0 text-green' : 'opacity-0 translate-x-1 text-muted'
          }`}
          aria-hidden="true"
        >
          Copied
        </span>
      </div>
    </div>
  );
}
