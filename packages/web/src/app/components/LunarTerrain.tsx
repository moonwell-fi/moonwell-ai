'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

type Vec2 = { x: number; y: number };
type Variant = 'hero' | 'footer';

/**
 * Lunar contour terrain — thin hairline topographic lines over a slowly
 * undulating plane. One ridge band glows in Moonwell accent blue. Pure
 * shader work; the plane is static geometry, all motion lives in uniforms.
 */

// Shared across every LunarTerrain instance — a single window pointermove
// listener feeds one mutable ref read by every Canvas. Sentinel (-10, -10)
// means no real input yet.
const sharedPointer: Vec2 = { x: -10, y: -10 };
let listenerCount = 0;
let detachListener: (() => void) | null = null;

function subscribePointer(): () => void {
  listenerCount += 1;
  if (listenerCount === 1) {
    const onMove = (e: PointerEvent) => {
      sharedPointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sharedPointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    detachListener = () => window.removeEventListener('pointermove', onMove);
  }
  return () => {
    listenerCount -= 1;
    if (listenerCount === 0 && detachListener) {
      detachListener();
      detachListener = null;
    }
  };
}

const vertexShader = /* glsl */ `
  varying float vElevation;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uScale;

  // 2D simplex noise — Ashima Arts / Stefan Gustavson
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vUv = uv;
    vec2 p = uv * uScale;
    float t = uTime * 0.045;
    float e = fbm(p + vec2(t, -t * 0.6));
    // Crater-like bowls: sparse, deeper
    e -= 0.35 * smoothstep(0.5, 0.8, snoise(uv * 4.0 + 13.0));
    vElevation = e;

    vec3 pos = position;
    pos.z += e * 0.6;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vElevation;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec3 uBg;
  uniform vec3 uContour;
  uniform vec3 uAccent;
  uniform float uDensity;
  uniform float uPoolHi;
  uniform float uPoolLo;
  uniform float uPoolStrength;
  uniform float uSweepAngle;
  uniform float uSweepStrength;
  uniform vec2 uCursor;

  void main() {
    float bands = vElevation * uDensity;
    float lineDist = abs(fract(bands) - 0.5) * 2.0;
    float thickness = 0.05 + 0.04 * fwidth(bands);
    float line = 1.0 - smoothstep(thickness, thickness + 0.03, lineDist);

    vec2 centered = vUv - 0.5;
    float r = length(centered * vec2(1.3, 1.0));
    float edgeFade = smoothstep(0.58, 0.22, r);

    // Valley-pooling glow (hero's primary moment) — static, lit from within
    // low elevations so basins read as filled with dim accent light.
    float pool = smoothstep(uPoolHi, uPoolLo, vElevation) * uPoolStrength;

    // Radar sweep (footer's primary moment) — a slow angular wedge rotates
    // from plane center with a short bright head and a fading trail.
    float fragAngle = atan(centered.y, centered.x);
    float da = mod(fragAngle - uSweepAngle, 6.28318);
    float leading = 1.0 - smoothstep(0.0, 0.26, da);
    float trail = (1.0 - smoothstep(0.26, 0.70, da)) * 0.5;
    float sweep = max(leading, trail) * uSweepStrength;

    float d = distance(vUv, uCursor);
    float hover = smoothstep(0.18, 0.0, d);

    vec3 col = uBg;
    col = mix(col, uContour, line * 0.55);
    col = mix(col, uAccent, pool * 0.25);
    col = mix(col, uAccent, line * sweep * 0.9);
    col = mix(col, uAccent, line * hover * 0.6);

    float alpha = (
      line * 0.55
      + pool * 0.18
      + line * sweep * 0.35
      + line * hover * 0.2
    ) * edgeFade;

    gl_FragColor = vec4(col, alpha);
  }
`;

type VariantConfig = {
  rotationX: number;
  scale: number;
  density: number;
  poolHi: number;
  poolLo: number;
  poolStrength: number;
  sweepStrength: number;
};

const SWEEP_SPEED = (2 * Math.PI) / 20; // one revolution per ~20s
const SWEEP_REDUCED_ANGLE = 2.2; // static bearing when reduce-motion is set

const VARIANT_SHADER: Record<Variant, VariantConfig> = {
  hero: {
    rotationX: -0.9,
    scale: 3.2,
    density: 9.0,
    poolHi: 0.05,
    poolLo: -0.35,
    poolStrength: 1.0,
    sweepStrength: 0.0,
  },
  footer: {
    rotationX: -1.15,
    scale: 5.2,
    density: 13.0,
    poolHi: 0.0,
    poolLo: -0.4,
    poolStrength: 0.0,
    sweepStrength: 0.9,
  },
};

function Terrain({
  reduceMotion,
  config,
}: {
  reduceMotion: boolean;
  config: VariantConfig;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBg: { value: new THREE.Color('#0f0d0e') },
      uContour: { value: new THREE.Color('#887982') },
      uAccent: { value: new THREE.Color('#2474da') },
      uDensity: { value: config.density },
      uScale: { value: config.scale },
      uPoolHi: { value: config.poolHi },
      uPoolLo: { value: config.poolLo },
      uPoolStrength: { value: config.poolStrength },
      uSweepAngle: {
        value:
          config.sweepStrength > 0 && reduceMotion ? SWEEP_REDUCED_ANGLE : 0,
      },
      uSweepStrength: { value: config.sweepStrength },
      uCursor: { value: new THREE.Vector2(-10, -10) },
    }),
    // Uniforms are created once and mutated in place; variant config is
    // expected to be stable for a given mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    if (!mat.current || !mesh.current) return;
    if (!reduceMotion) {
      mat.current.uniforms.uTime.value += delta;
      if (config.sweepStrength > 0) {
        mat.current.uniforms.uSweepAngle.value =
          (mat.current.uniforms.uSweepAngle.value + delta * SWEEP_SPEED) %
          (Math.PI * 2);
      }
      const p = sharedPointer;
      if (p.x > -5 && p.y > -5) {
        const tx = p.x * 0.08;
        const ty = p.y * 0.06;
        mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, config.rotationX + ty, 0.05);
        mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, tx, 0.05);
        const cursor = mat.current.uniforms.uCursor.value as THREE.Vector2;
        cursor.x = (p.x + 1) * 0.5;
        cursor.y = (p.y + 1) * 0.5;
      }
    }
  });

  return (
    <mesh ref={mesh} rotation={[config.rotationX, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8, 5, 180, 120]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function LunarTerrain({ variant = 'hero' }: { variant?: Variant }) {
  const reduceMotion = useReducedMotion() ?? false;
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Footer variant defers WebGL mount until it scrolls into view so we don't
  // spin up a second Canvas on initial page load.
  const [mounted, setMounted] = useState(variant === 'hero');

  useEffect(() => {
    if (reduceMotion) return;
    return subscribePointer();
  }, [reduceMotion]);

  useEffect(() => {
    if (mounted) return;
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true);
            io.disconnect();
            return;
          }
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const wrapperStyle =
    variant === 'hero'
      ? {
          height: 'min(100dvh, 900px)',
          maskImage: 'radial-gradient(ellipse at 50% 55%, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 55%, black 35%, transparent 80%)',
        }
      : {
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)',
        };

  const wrapperPosition =
    variant === 'hero'
      ? 'absolute top-0 left-0 right-0 z-0 overflow-hidden'
      : 'absolute inset-0 z-0 overflow-hidden';

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className={`pointer-events-none ${wrapperPosition}`}
      style={wrapperStyle}
    >
      {mounted && (
        <Canvas
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 3.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          frameloop={reduceMotion ? 'demand' : 'always'}
        >
          <Terrain reduceMotion={reduceMotion} config={VARIANT_SHADER[variant]} />
        </Canvas>
      )}
    </div>
  );
}
