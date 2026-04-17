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

  const Icon = copied ? Check : Copy;

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied skill URL' : 'Copy skill URL'}
      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-accent text-white text-base font-semibold hover:bg-accent-hover transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      Install skill
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
