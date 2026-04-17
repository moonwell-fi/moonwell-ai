'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { RotateCw } from 'lucide-react';

const COMMAND = 'check my yield opportunities on moonwell';
const RESULTS = [
  { symbol: 'USDC', apy: '8.2% APY', tvl: '$42M TVL' },
  { symbol: 'ETH', apy: '3.1% APY', tvl: '$18M TVL' },
  { symbol: 'cbBTC', apy: '4.7% APY', tvl: '$9M TVL' },
] as const;

type Phase = 'idle' | 'typing' | 'scanning' | 'results' | 'complete';

const MIN_HEIGHT = 176;
const rowSpring = { type: 'spring' as const, stiffness: 180, damping: 22 };
const rowEnter = {
  initial: { opacity: 0, y: 10, filter: 'blur(5px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

function typingDelay(ch: string): number {
  const base = 32 + Math.random() * 38;
  if (ch === ' ') return base + 80 + Math.random() * 70;
  return base;
}

const CARET_CLASS =
  'inline-block w-[0.5em] h-[1em] -mb-[0.15em] ml-[1px] bg-accent align-baseline cursor-blink';

export default function TerminalDemo() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const startedRef = useRef(false);
  const lastHRef = useRef(MIN_HEIGHT);

  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState('');
  const [rowsShown, setRowsShown] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [runCount, setRunCount] = useState(0);

  // Spring lives outside React so height interpolation never triggers a
  // re-render and avoids framer's layout FLIP transform.
  const heightTarget = useMotionValue(MIN_HEIGHT);
  const height = useSpring(heightTarget, { stiffness: 200, damping: 28, mass: 0.9 });

  const run = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setTyped('');
    setRowsShown(0);

    if (reduceMotion) {
      setPhase('complete');
      setTyped(COMMAND);
      setRowsShown(RESULTS.length);
      return;
    }

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(setTimeout(fn, ms));
    };

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
  }, [reduceMotion]);

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
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [run]);

  useEffect(() => {
    if (runCount === 0) return;
    run();
  }, [runCount, run]);

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
          {`Terminal: ${COMMAND}. Scanned Base markets. ${RESULTS.map(
            (r) => `${r.symbol} ${r.apy}, ${r.tvl}`
          ).join('. ')}.`}
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

      <div ref={contentRef} className="relative px-5 py-4 space-y-2" aria-hidden="true">
        <div>
          <span className="text-accent select-none">❯ </span>
          <span className="text-foreground">{typed}</span>
          {showTypingCaret && <span className={CARET_CLASS} />}
        </div>

        <AnimatePresence>
          {(phase === 'scanning' || phase === 'results' || phase === 'complete') && (
            <motion.div
              key="scan"
              className="text-muted ml-4"
              {...rowEnter}
              transition={reduceMotion ? { duration: 0 } : rowSpring}
            >
              <span className="select-none">↳ </span>
              scanning Base markets
              {phase === 'scanning' ? <ScanDots /> : <span className="select-none">&hellip;</span>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5 ml-4 pt-1">
          <AnimatePresence>
            {RESULTS.slice(0, rowsShown).map((r) => (
              <motion.div
                key={`${r.symbol}-${runCount}`}
                className="flex gap-2"
                {...rowEnter}
                transition={reduceMotion ? { duration: 0 } : rowSpring}
              >
                <ResultCheck />
                <span className="text-foreground w-14">{r.symbol}</span>
                <span className="text-accent w-20">{r.apy}</span>
                <span className="text-muted">{r.tvl}</span>
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

function ScanDots() {
  return (
    <span className="inline-block w-[1.25em] select-none">
      <span className="scan-dot">.</span>
      <span className="scan-dot">.</span>
      <span className="scan-dot">.</span>
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
      transition={
        reduceMotion
          ? { duration: 0 }
          : { color: { delay: 0.22, duration: 0.45 }, filter: { duration: 0.22 } }
      }
    >
      ✓
    </motion.span>
  );
}
