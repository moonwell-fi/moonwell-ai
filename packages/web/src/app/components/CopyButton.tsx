'use client';

import { useEffect, useRef, useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      className="shrink-0 inline-flex items-center justify-center -m-2 p-2 rounded-md text-muted/50 hover:text-foreground transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M2.5 8l3.5 3.5L12.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <rect x="5" y="1" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1 4.5A1.5 1.5 0 0 1 2.5 3H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M1 4.5V12a1.5 1.5 0 0 0 1.5 1.5H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
