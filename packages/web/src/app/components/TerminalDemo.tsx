'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RotateCw } from 'lucide-react';

const COMMAND = 'check my yield opportunities on moonwell';
const RESULTS = [
  { symbol: 'USDC', apy: '8.2% APY', tvl: '$42M TVL' },
  { symbol: 'ETH', apy: '3.1% APY', tvl: '$18M TVL' },
  { symbol: 'cbBTC', apy: '4.7% APY', tvl: '$9M TVL' },
] as const;

type Phase = 'idle' | 'typing' | 'scanning' | 'results' | 'complete';

const rowSpring = { type: 'spring' as const, stiffness: 180, damping: 22 };
const rowEnter = {
  initial: { opacity: 0, y: 10, filter: 'blur(5px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

function typingDelay(ch: string): number {
  // variable cadence: quick for letters, longer on punctuation/spaces
  const base = 32 + Math.random() * 38;
  if (ch === ' ') return base + 80 + Math.random() * 70;
  return base;
}

export default function TerminalDemo() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const startedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState('');
  const [rowsShown, setRowsShown] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [runCount, setRunCount] = useState(0);

  function schedule(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }

  function clearAll() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function run() {
    clearAll();
    setTyped('');
    setRowsShown(0);

    if (reduceMotion) {
      setPhase('complete');
      setTyped(COMMAND);
      setRowsShown(RESULTS.length);
      return;
    }

    setPhase('typing');
    let i = 0;
    const typeNext = () => {
      if (i >= COMMAND.length) {
        schedule(() => setPhase('scanning'), 420);
        schedule(() => {
          setPhase('results');
          RESULTS.forEach((_, idx) => {
            schedule(() => setRowsShown(idx + 1), idx * 210);
          });
          schedule(() => setPhase('complete'), RESULTS.length * 210 + 120);
        }, 420 + 1000);
        return;
      }
      const ch = COMMAND[i];
      setTyped(COMMAND.slice(0, i + 1));
      i += 1;
      schedule(typeNext, typingDelay(ch));
    };
    typeNext();
  }

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !startedRef.current) {
            startedRef.current = true;
            run();
            io.disconnect();
          }
        }
      },
      { threshold: [0.5] }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run when user clicks rerun button
  useEffect(() => {
    if (runCount === 0) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runCount]);

  const showCaret = phase === 'typing' || phase === 'scanning' || phase === 'complete';

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="relative px-5 py-4 font-mono text-sm min-h-[11rem]"
    >
      {/* Screen-reader summary — renders full content instantly */}
      <p className="sr-only" aria-live="polite">
        {phase === 'complete'
          ? `Terminal: ${COMMAND}. Scanned Base markets. ${RESULTS.map(
              (r) => `${r.symbol} ${r.apy}, ${r.tvl}`
            ).join('. ')}.`
          : ''}
      </p>

      {/* Scanline sweep — one pass during scanning phase */}
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

      <div className="relative space-y-2" aria-hidden="true">
        {/* Prompt line */}
        <div>
          <span className="text-accent select-none" aria-hidden="true">❯ </span>
          <span className="text-foreground">{typed}</span>
          {showCaret && (
            <span
              className="inline-block w-[0.5em] h-[1em] -mb-[0.15em] ml-[1px] bg-accent align-baseline cursor-blink"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Scanning line */}
        <AnimatePresence>
          {(phase === 'scanning' || phase === 'results' || phase === 'complete') && (
            <motion.div
              key="scan"
              className="text-muted ml-4"
              {...rowEnter}
              transition={reduceMotion ? { duration: 0 } : rowSpring}
            >
              <span className="select-none" aria-hidden="true">↳ </span>
              scanning Base markets
              {phase === 'scanning' ? <ScanDots /> : <span className="select-none">&hellip;</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result rows */}
        <div className="space-y-1.5 ml-4 pt-1">
          <AnimatePresence>
            {RESULTS.slice(0, rowsShown).map((r, idx) => (
              <motion.div
                key={`${r.symbol}-${runCount}`}
                className="flex gap-2"
                {...rowEnter}
                transition={reduceMotion ? { duration: 0 } : { ...rowSpring, delay: idx === rowsShown - 1 ? 0 : 0 }}
              >
                <ResultCheck />
                <span className="text-foreground w-14">{r.symbol}</span>
                <span className="text-accent w-20">{r.apy}</span>
                <span className="text-muted">{r.tvl}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Rerun affordance — appears after completion on hover */}
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
    </div>
  );
}

function ScanDots() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <span className="select-none">&hellip;</span>;
  return (
    <span className="inline-block w-[1.25em] select-none" aria-hidden="true">
      <motion.span
        animate={{ opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1] }}
      >.</motion.span>
      <motion.span
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1] }}
      >.</motion.span>
      <motion.span
        animate={{ opacity: [0, 0, 0, 1, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1] }}
      >.</motion.span>
    </span>
  );
}

function ResultCheck() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      className="shrink-0 select-none"
      initial={reduceMotion ? false : { color: 'var(--accent)', filter: 'blur(3px)' }}
      animate={{ color: 'var(--green)', filter: 'blur(0px)' }}
      transition={reduceMotion ? { duration: 0 } : { color: { delay: 0.22, duration: 0.45 }, filter: { duration: 0.22 } }}
      aria-hidden="true"
    >
      ✓
    </motion.span>
  );
}
