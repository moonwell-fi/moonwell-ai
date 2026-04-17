'use client';

import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import CopyCheckSwap from './CopyCheckSwap';

const SKILL_URL = 'https://agents.moonwell.fi/skill.md';

export default function CopySkillButton() {
  const [copied, copy] = useCopyToClipboard(SKILL_URL);

  return (
    <button
      onClick={copy}
      aria-label={copied ? 'Copied skill URL' : 'Copy skill URL'}
      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-accent text-white text-base font-semibold hover:bg-accent-hover transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {/* Width anchor so the label swap doesn't reflow the button */}
      <span className="relative inline-block">
        <span className="invisible" aria-hidden="true">Copy skill URL</span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-150 ease-out ${
            copied ? 'opacity-0 -translate-y-0.5 blur-[3px]' : 'opacity-100 translate-y-0 blur-0'
          }`}
        >
          Copy skill URL
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-150 ease-out ${
            copied ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-0.5 blur-[3px]'
          }`}
        >
          Copied
        </span>
      </span>
      <CopyCheckSwap copied={copied} size={16} strokeWidth={2} />
    </button>
  );
}
