'use client';

import dynamic from 'next/dynamic';

const LunarTerrain = dynamic(() => import('./LunarTerrain'), { ssr: false });

export default function LunarTerrainMount() {
  return <LunarTerrain />;
}
