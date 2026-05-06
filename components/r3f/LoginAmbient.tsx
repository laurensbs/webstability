"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * Soft warping terracotta blob for the login left-panel. Subtle
 * distortion that breathes — it's the only thing happening in the
 * dark panel besides the wordmark, so it has to feel intentional and
 * never noisy.
 *
 * Sits absolute-positioned behind the panel's content (panelTitle +
 * bullets), so the typography reads first and the 3D fills empty
 * negative space.
 */

function Blob() {
  const meshRef = React.useRef<THREE.Mesh>(null);
  // Drei MeshDistortMaterial's impl type (DistortMaterialImpl) isn't
  // exported. Type the ref as any for the handoff and access `.distort`
  // with a runtime guard from the frame loop.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = React.useRef<any>(null);

  useFrame((state, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.15;
      meshRef.current.rotation.x += dt * 0.08;
    }
    if (matRef.current && "distort" in matRef.current) {
      matRef.current.distort = 0.3 + Math.sin(state.clock.elapsedTime * 0.6) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.6}>
      <icosahedronGeometry args={[1, 4]} />
      <MeshDistortMaterial
        ref={matRef}
        color="#C9614F"
        distort={0.3}
        speed={1.5}
        roughness={0.2}
        metalness={0.1}
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

export default function LoginAmbient({ className }: { className?: string }) {
  const [enabled] = React.useState(shouldEnable);
  if (!enabled) return null;

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 4], fov: 40 }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 2, 4]} intensity={0.8} color="#fff" />
        <pointLight position={[-2, 0, 3]} color="#C9614F" intensity={1.2} distance={10} />
        <Blob />
      </Canvas>
    </div>
  );
}
