'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

const SKILL_URL = 'https://agents.moonwell.fi/skill.md';

export default function CopySkillButton() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(SKILL_URL);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied skill URL' : 'Copy skill URL'}
      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-accent text-white text-base font-semibold hover:bg-accent-hover transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="relative inline-block">
        {/* width anchor — invisible copy of the longest label */}
        <span className="invisible" aria-hidden="true">Copy skill URL</span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-150 ease-out ${copied ? 'opacity-0 -translate-y-0.5 blur-[3px]' : 'opacity-100 translate-y-0 blur-0'}`}
          aria-hidden={copied ? 'true' : undefined}
        >
          Copy skill URL
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-150 ease-out ${copied ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-0.5 blur-[3px]'}`}
          aria-hidden={copied ? undefined : 'true'}
        >
          Copied
        </span>
      </span>
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <Copy
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className={`absolute transition-[opacity,transform,filter] duration-150 ease-out ${copied ? 'opacity-0 scale-90 blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}
        />
        <Check
          size={16}
          strokeWidth={2.25}
          aria-hidden="true"
          className={`absolute transition-[opacity,transform,filter] duration-150 ease-out ${copied ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-[2px]'}`}
        />
      </span>
    </button>
  );
}
