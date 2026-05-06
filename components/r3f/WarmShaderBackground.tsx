"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Site-wide ambient shader background. A full-screen plane running a
 * cheap simplex-noise GLSL shader that lerps between two cream tones,
 * with a subtle terracotta haze top-right and a teal whisper bottom-left.
 *
 * Designed to be a near-static texture that breathes — the time uniform
 * advances at 0.04/sec so motion is barely perceivable. Sits behind all
 * content, never captures pointer events.
 *
 * Mounted via dynamic import in the marketing layout with ssr: false so
 * three.js never lands in the server bundle.
 */

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = `
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  // Ashima simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = vec2(uv.x * aspect, uv.y);

    float n1 = snoise(p * 1.5 + u_time * 0.04);
    float n2 = snoise(p * 0.8 - u_time * 0.025);
    float n = (n1 + n2 * 0.5) * 0.5;

    vec3 color1 = vec3(0.961, 0.941, 0.910); // #F5F0E8
    vec3 color2 = vec3(0.937, 0.910, 0.859); // #EFE8DB
    vec3 color = mix(color1, color2, smoothstep(-0.2, 0.4, n));

    // Subtle terracotta haze, top-right
    vec2 dist1 = uv - vec2(0.85, 0.85);
    vec3 accent = vec3(0.788, 0.380, 0.310);
    color = mix(color, accent, smoothstep(0.6, 0.0, length(dist1)) * 0.05);

    // Teal whisper, bottom-left
    vec2 dist2 = uv - vec2(0.15, 0.15);
    vec3 teal = vec3(0.172, 0.372, 0.364);
    color = mix(color, teal, smoothstep(0.6, 0.0, length(dist2)) * 0.03);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function ShaderPlane() {
  const matRef = React.useRef<THREE.ShaderMaterial>(null);
  const uniforms = React.useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: {
        value: new THREE.Vector2(
          typeof window !== "undefined" ? window.innerWidth : 1920,
          typeof window !== "undefined" ? window.innerHeight : 1080,
        ),
      },
    }),
    [],
  );

  // Update resolution on viewport resize.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [uniforms]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} />
    </mesh>
  );
}

function shouldEnable() {
  if (typeof window === "undefined") return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return fine && !reduce;
}

export default function WarmShaderBackground() {
  // Lazy init — only runs once on mount. SSR returns false; client mounts
  // with the right value immediately. Skip on reduced-motion and touch-
  // only devices where continuous webgl frames are wasted battery.
  const [enabled] = React.useState(shouldEnable);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 1] }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
