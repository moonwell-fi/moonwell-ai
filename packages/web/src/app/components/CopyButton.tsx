'use client';

import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import CopyCheckSwap from './CopyCheckSwap';

export default function CopyButton({ text }: { text: string }) {
  const [copied, copy] = useCopyToClipboard(text);

  return (
    <button
      onClick={copy}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      className="shrink-0 inline-flex items-center justify-center -m-2 p-2 rounded-md text-muted/60 hover:text-foreground transition-colors duration-150 cursor-pointer focus-ring-btn"
    >
      <CopyCheckSwap copied={copied} size={15} strokeWidth={1.75} checkClassName="text-green" />
    </button>
  );
}
