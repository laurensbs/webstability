"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Slow-rotating torus knot in cream physical-glass — sits behind the
 * Founder block's portrait area on lg+ screens. The point isn't
 * "look at the 3D" but "this site is hand-crafted enough to bother".
 *
 * Subtle: 0.15-0.25 rad/sec rotation, transmissive material, soft
 * accent point-light from below-right. No distortion, no procedural
 * noise — premium reads as restraint.
 */

function Knot() {
  const ref = React.useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.15;
    ref.current.rotation.y += dt * 0.25;
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.025);
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[0.7, 0.25, 128, 16, 2, 3]} />
      <meshPhysicalMaterial
        color="#EFE8DB"
        metalness={0.05}
        roughness={0.25}
        transmission={0.4}
        thickness={1.2}
        ior={1.4}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function shouldEnable() {
  if (typeof window === "undefined") return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return fine && !reduce;
}

export default function FounderForm({ className }: { className?: string }) {
  const [enabled] = React.useState(shouldEnable);
  if (!enabled) return null;

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 3], fov: 40 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 3]} intensity={1.4} color="#ffd0bd" />
        <pointLight position={[-2, -1, 2]} color="#2C5F5D" intensity={0.6} distance={10} />
        <pointLight position={[2, 0, 2]} color="#C9614F" intensity={0.8} distance={10} />
        <Knot />
      </Canvas>
    </div>
  );
}
