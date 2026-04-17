'use client';

import dynamic from 'next/dynamic';

const LunarTerrain = dynamic(() => import('./LunarTerrain'), { ssr: false });

export default function LunarTerrainMount({
  variant = 'hero',
}: {
  variant?: 'hero' | 'footer';
}) {
  return <LunarTerrain variant={variant} />;
}
