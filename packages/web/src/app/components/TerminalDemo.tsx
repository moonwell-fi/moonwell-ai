'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import {
  RUN_SCRIPT_EVENT,
  SCRIPTS,
  type OutputColor,
  type OutputRow,
  type Script,
} from '../lib/scripts';

type Phase = 'idle' | 'typing' | 'morphing' | 'scanning' | 'results' | 'complete';

const MIN_HEIGHT = 176;
const rowSpring = { type: 'spring' as const, stiffness: 180, damping: 22 };
const rowEnter = {
  initial: { opacity: 0, y: 10, filter: 'blur(5px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

function typingDelay(ch: string): number {
  const base = 15 + Math.random() * 15;
  if (ch === ' ') return base + 30 + Math.random() * 30;
  return base;
}

const CARET_CLASS =
  'inline-block w-[0.5em] h-[1em] -mb-[0.15em] ml-[1px] bg-accent align-baseline cursor-blink';

const COLOR_CLASS: Record<OutputColor, string> = {
  foreground: 'text-foreground',
  accent: 'text-accent',
  muted: 'text-muted',
  green: 'text-green',
  orange: 'text-orange',
  red: 'text-red',
};

function ValueCell({ value, color }: { value: string; color: OutputColor }) {
  const reduceMotion = useReducedMotion();
  // Values that settle to green animate from accent → green to match the
  // CLI's "simulated ✓" moment without breaking the one-font-size rule.
  if (color === 'green' && !reduceMotion) {
    return (
      <motion.span
        initial={{ color: 'var(--accent)', filter: 'blur(3px)' }}
        animate={{ color: 'var(--green)', filter: 'blur(0px)' }}
        transition={{ color: { delay: 0.22, duration: 0.45 }, filter: { duration: 0.22 } }}
      >
        {value}
      </motion.span>
    );
  }
  return <span className={COLOR_CLASS[color]}>{value}</span>;
}

function RowRenderer({ row }: { row: OutputRow }) {
  switch (row.type) {
    case 'cmd':
      return (
        <div className="leading-6 pl-[2ch] -indent-[2ch]">
          <span className="text-accent select-none" aria-hidden="true">❯ </span>
          <span className="text-foreground">{row.text}</span>
        </div>
      );
    case 'header':
      return <div className="pl-2 text-foreground font-semibold">{row.text}</div>;
    case 'asset':
      return <div className="pl-2 text-foreground font-semibold">{row.text}</div>;
    case 'kv':
      return (
        <div className="flex gap-3 pl-4">
          <span className="text-accent w-36 shrink-0">{row.key}</span>
          <ValueCell value={row.value} color={row.valueColor ?? 'foreground'} />
        </div>
      );
    case 'kvkv':
      return (
        <div className="flex gap-3 pl-4">
          <span className="text-accent w-28 shrink-0">{row.k1}</span>
          <span className="text-foreground w-20 shrink-0">{row.v1}</span>
          <span className="text-accent w-14 shrink-0">{row.k2}</span>
          <span className="text-foreground">{row.v2}</span>
        </div>
      );
    case 'step':
      return (
        <div className="flex gap-2 pl-4">
          <span className="text-accent shrink-0">{row.name}</span>
          <span className="text-muted select-none shrink-0" aria-hidden="true">—</span>
          <span className="text-muted">{row.desc}</span>
        </div>
      );
    case 'dim':
      return <div className="pl-8 text-muted">{row.text}</div>;
    case 'blank':
      return <div>&nbsp;</div>;
  }
}

export default function TerminalDemo() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const startedRef = useRef(false);
  const lastHRef = useRef(MIN_HEIGHT);

  const [script, setScript] = useState<Script>(SCRIPTS.yield);
  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState('');
  const [rowsShown, setRowsShown] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const heightTarget = useMotionValue(MIN_HEIGHT);
  const height = useSpring(heightTarget, { stiffness: 200, damping: 28, mass: 0.9 });

  const run = useCallback((next: Script, { rerun = false }: { rerun?: boolean } = {}) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setRowsShown(0);

    if (reduceMotion) {
      setPhase('complete');
      setTyped(next.prompt);
      setRowsShown(next.rows.length);
      return;
    }

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(setTimeout(fn, ms));
    };

    const runResults = () => {
      setPhase('scanning');
      schedule(() => {
        setPhase('results');
        let acc = 0;
        next.rows.forEach((r, idx) => {
          schedule(() => setRowsShown(idx + 1), acc);
          acc += r.type === 'blank' ? 20 : 150;
        });
        schedule(() => setPhase('complete'), acc + 120);
      }, 900);
    };

    if (rerun) {
      // Skip typing: the prompt text is swapped via per-character blur-fade
      // transitions in the render path. Hold briefly so the morph reads
      // before the scan begins.
      setTyped(next.prompt);
      setPhase('morphing');
      schedule(runResults, 420);
      return;
    }

    setTyped('');
    setPhase('typing');
    let i = 0;
    const typeNext = () => {
      if (i >= next.prompt.length) {
        schedule(runResults, 420);
        return;
      }
      const ch = next.prompt[i];
      setTyped(next.prompt.slice(0, i + 1));
      i += 1;
      schedule(typeNext, typingDelay(ch));
    };
    typeNext();
  }, [reduceMotion]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !startedRef.current) {
            startedRef.current = true;
            run(script);
            io.disconnect();
          }
        }
      },
      { threshold: [0.5] }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [run, script]);

  useEffect(() => {
    if (runCount === 0) return;
    run(script, { rerun: true });
  }, [runCount, run, script]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const next = SCRIPTS[id];
      if (!next) return;
      startedRef.current = true;
      setScript(next);
      setRunCount((n) => n + 1);
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    window.addEventListener(RUN_SCRIPT_EVENT, handler);
    return () => window.removeEventListener(RUN_SCRIPT_EVENT, handler);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const h = Math.max(el.getBoundingClientRect().height, MIN_HEIGHT);
      if (h === lastHRef.current) return;
      lastHRef.current = h;
      if (reduceMotion) heightTarget.jump(h);
      else heightTarget.set(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduceMotion, heightTarget]);

  const showTypingCaret = phase === 'typing';
  const showReadyCaret = phase === 'complete';

  return (
    <motion.div
      ref={rootRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ height }}
      className="relative font-mono text-sm overflow-hidden"
    >
      {phase === 'complete' && (
        <p className="sr-only" aria-live="polite">
          {`Prompt: ${script.prompt}. ${script.scanLine}.`}
        </p>
      )}

      <AnimatePresence>
        {phase === 'scanning' && !reduceMotion && (
          <motion.div
            key={`sweep-${runCount}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <motion.div
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-accent/[0.08] to-transparent"
              initial={{ x: '-120%' }}
              animate={{ x: '240%' }}
              transition={{ duration: 0.9, ease: [0.23, 0.88, 0.26, 0.92] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={contentRef} className="relative px-5 py-4 space-y-1" aria-hidden="true">
        <div className="leading-6 pl-[2ch] -indent-[2ch]">
          <span className="text-accent select-none">❯ </span>
          {phase === 'typing' || phase === 'idle' ? (
            <span className="text-foreground">{typed}</span>
          ) : (
            <PromptText text={script.prompt} runCount={runCount} reduceMotion={!!reduceMotion} />
          )}
          {showTypingCaret && <span className={CARET_CLASS} />}
        </div>

        <AnimatePresence>
          {(phase === 'scanning' || phase === 'results' || phase === 'complete') && (
            <motion.div
              key={`scan-${script.id}-${runCount}`}
              className="text-muted pl-4"
              {...rowEnter}
              transition={reduceMotion ? { duration: 0 } : rowSpring}
            >
              <span className="select-none">↳ </span>
              {script.scanLine}
              {phase === 'scanning' ? <ScanDots /> : <span className="select-none">&hellip;</span>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-1 space-y-0.5">
          <AnimatePresence>
            {script.rows.slice(0, rowsShown).map((r, idx) => (
              <motion.div
                key={`${script.id}-${idx}-${runCount}`}
                {...rowEnter}
                transition={reduceMotion ? { duration: 0 } : rowSpring}
              >
                <RowRenderer row={r} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showReadyCaret && (
            <motion.div
              key="ready"
              className="pt-1"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.25, delay: 0.15 }}
            >
              <span className="text-accent select-none">❯ </span>
              <span className={CARET_CLASS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === 'complete' && hovering && (
          <motion.button
            key="rerun"
            onClick={() => {
              startedRef.current = true;
              setRunCount((n) => n + 1);
            }}
            aria-label="Rerun terminal demo"
            className="absolute bottom-3 right-3 inline-flex items-center justify-center h-7 w-7 rounded-md text-muted hover:text-accent transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
          >
            <RotateCw size={14} strokeWidth={1.75} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PromptText({
  text,
  runCount,
  reduceMotion,
}: {
  text: string;
  runCount: number;
  reduceMotion: boolean;
}) {
  if (reduceMotion) {
    return <span className="text-foreground">{text}</span>;
  }
  return (
    <span className="text-foreground">
      {Array.from(text).map((ch, idx) => (
        <motion.span
          // Key by runCount + idx so every rerun remounts each glyph and
          // replays the blur-fade even when the character at that position
          // hasn't changed.
          key={`${runCount}-${idx}`}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.22,
            delay: Math.min(idx * 0.015, 0.4),
            ease: 'easeOut',
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

function ScanDots() {
  return (
    <span className="inline-block w-[1.25em] select-none">
      <span className="scan-dot">.</span>
      <span className="scan-dot">.</span>
      <span className="scan-dot">.</span>
    </span>
  );
}
