'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

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
      className="shrink-0 inline-flex items-center justify-center -m-2 p-2 rounded-md text-muted/60 hover:text-foreground transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="relative inline-flex h-[15px] w-[15px] items-center justify-center">
        <Copy
          size={15}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`absolute transition-[opacity,transform,filter] duration-150 ease-out ${copied ? 'opacity-0 scale-90 blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}
        />
        <Check
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className={`absolute transition-[opacity,transform,filter] duration-150 ease-out ${copied ? 'opacity-100 scale-100 blur-0 text-green' : 'opacity-0 scale-90 blur-[2px]'}`}
        />
      </span>
    </button>
  );
}
