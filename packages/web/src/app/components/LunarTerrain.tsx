'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

type Vec2 = { x: number; y: number };

/**
 * Lunar contour terrain — thin hairline topographic lines over a slowly
 * undulating plane. One ridge band glows in Moonwell accent blue. Pure
 * shader work; the plane is static geometry, all motion lives in uniforms.
 */

const vertexShader = /* glsl */ `
  varying float vElevation;
  varying vec2 vUv;

  uniform float uTime;

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
    vec2 p = uv * 3.2;
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
  uniform vec2 uCursor;

  void main() {
    // Contour bands from elevation
    float bands = vElevation * uDensity;
    float lineDist = abs(fract(bands) - 0.5) * 2.0;
    float thickness = 0.05 + 0.04 * fwidth(bands);
    float line = 1.0 - smoothstep(thickness, thickness + 0.03, lineDist);

    // Focus band: one ridge migrates slowly across the elevation range
    float focus = 0.22 + 0.25 * sin(uTime * 0.08);
    float focusBand = 1.0 - smoothstep(0.0, 0.055, abs(vElevation - focus));

    // Soft radial mask so the plane fades into the page background at edges
    vec2 centered = vUv - 0.5;
    float r = length(centered * vec2(1.3, 1.0));
    float edgeFade = smoothstep(0.58, 0.22, r);

    // Cursor proximity — soft radial falloff in UV space
    float d = distance(vUv, uCursor);
    float hover = smoothstep(0.18, 0.0, d);

    vec3 col = uBg;
    col = mix(col, uContour, line * 0.55);
    col = mix(col, uAccent, line * focusBand * 0.9);
    col = mix(col, uAccent, line * hover * 0.6);

    float alpha = (line * 0.55 + line * focusBand * 0.45 + line * hover * 0.2) * edgeFade;

    gl_FragColor = vec4(col, alpha);
  }
`;

function Terrain({ reduceMotion, pointerRef }: { reduceMotion: boolean; pointerRef: React.RefObject<Vec2> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBg: { value: new THREE.Color('#0f0d0e') },
      uContour: { value: new THREE.Color('#887982') },
      uAccent: { value: new THREE.Color('#2474da') },
      uDensity: { value: 9.0 },
      uCursor: { value: new THREE.Vector2(-10, -10) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!mat.current || !mesh.current) return;
    if (!reduceMotion) {
      mat.current.uniforms.uTime.value += delta;
      const p = pointerRef.current;
      // Sentinel (-10, -10) means no real pointer input yet — skip tilt + highlight.
      if (p.x > -5 && p.y > -5) {
        const tx = p.x * 0.08;
        const ty = p.y * 0.06;
        mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, -0.9 + ty, 0.05);
        mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, tx, 0.05);
        // NDC (-1..1) → screen UV (0..1). Y in pointerRef is already flipped
        // so +1 = top of screen; UV has +1 = top, so no extra flip needed.
        const cursor = mat.current.uniforms.uCursor.value as THREE.Vector2;
        cursor.x = (p.x + 1) * 0.5;
        cursor.y = (p.y + 1) * 0.5;
      }
    }
  });

  return (
    <mesh ref={mesh} rotation={[-0.9, 0, 0]} position={[0, 0, 0]}>
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

export default function LunarTerrain() {
  const reduceMotion = useReducedMotion() ?? false;
  // Track the cursor in a ref so no React render happens on mouse move.
  // The Canvas is pointer-events-none, so r3f's built-in `mouse` never
  // updates; listen on window instead.
  // Sentinel far off-screen so the cursor highlight stays dormant until a
  // real pointermove event fires (avoids an always-on spot at page load).
  const pointerRef = useRef<Vec2>({ x: -10, y: -10 });

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduceMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        maskImage:
          'radial-gradient(ellipse at 50% 55%, black 35%, transparent 80%)',
        WebkitMaskImage:
          'radial-gradient(ellipse at 50% 55%, black 35%, transparent 80%)',
      }}
    >
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 3.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        frameloop={reduceMotion ? 'demand' : 'always'}
      >
        <Terrain reduceMotion={reduceMotion} pointerRef={pointerRef} />
      </Canvas>
    </div>
  );
}
