'use client';

import { Check, Copy } from 'lucide-react';

type Props = {
  copied: boolean;
  size?: number;
  strokeWidth?: number;
  checkStrokeWidth?: number;
  checkClassName?: string;
};

export default function CopyCheckSwap({
  copied,
  size = 16,
  strokeWidth = 2,
  checkStrokeWidth,
  checkClassName = '',
}: Props) {
  const checkStroke = checkStrokeWidth ?? strokeWidth + 0.25;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Copy
        size={size}
        strokeWidth={strokeWidth}
        className={`absolute transition-[opacity,transform,filter] duration-150 ease-out ${
          copied ? 'opacity-0 scale-90 blur-[2px]' : 'opacity-100 scale-100 blur-0'
        }`}
      />
      <Check
        size={size}
        strokeWidth={checkStroke}
        className={`absolute transition-[opacity,transform,filter] duration-150 ease-out ${checkClassName} ${
          copied ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-[2px]'
        }`}
      />
    </span>
  );
}
