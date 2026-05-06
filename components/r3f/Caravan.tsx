"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * Low-poly caravan parked in 3D space — sits on the /verhuur hero.
 * Built from primitives (boxes / cylinders / torus) so the file weight
 * stays in the renderer, no external GLTF download. Total polycount
 * lands well under 8000 triangles per the spec budget.
 *
 * Behaviour:
 * - Idle: slow Y-rotation (~12°/sec) + 2px float bob
 * - ContactShadows beneath grounds the caravan in the cream surface
 *
 * Performance:
 * - dpr capped at [1, 1.5], antialias on (this is the focal element)
 * - Skipped on touch / reduced-motion entirely (returns null)
 */

function CaravanMesh() {
  const groupRef = React.useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += dt * 0.2; // ~12°/sec
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {/* Body — soft-edge cream box */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.6, 1.1, 1.2]} />
        <meshStandardMaterial color="#EFE8DB" roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Roof — slightly darker cream, narrower */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[2.5, 0.08, 1.15]} />
        <meshStandardMaterial color="#E5DDCC" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Front rounded bevel (small block to suggest aerodynamic nose) */}
      <mesh position={[1.25, 0.55, 0]} castShadow>
        <boxGeometry args={[0.2, 0.95, 1.1]} />
        <meshStandardMaterial color="#D8CDB6" roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Window — dark transmission glass on the side */}
      <mesh position={[-0.1, 0.78, 0.605]}>
        <boxGeometry args={[1.2, 0.42, 0.04]} />
        <meshPhysicalMaterial
          color="#1F1B16"
          metalness={0.1}
          roughness={0.15}
          transmission={0.85}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>

      {/* Door */}
      <mesh position={[-1.0, 0.4, 0.605]}>
        <boxGeometry args={[0.45, 0.7, 0.04]} />
        <meshStandardMaterial color="#D8CDB6" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Door handle */}
      <mesh position={[-0.85, 0.4, 0.63]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#C9614F" metalness={0.2} roughness={0.4} />
      </mesh>

      {/* Terracotta racing stripe along the body */}
      <mesh position={[0, 0.35, 0.605]}>
        <boxGeometry args={[2.55, 0.08, 0.005]} />
        <meshStandardMaterial color="#C9614F" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.35, -0.605]}>
        <boxGeometry args={[2.55, 0.08, 0.005]} />
        <meshStandardMaterial color="#C9614F" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Wheels — torus + filled hub */}
      {[
        [0.85, 0.0, 0.65],
        [-0.85, 0.0, 0.65],
        [0.85, 0.0, -0.65],
        [-0.85, 0.0, -0.65],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.22, 0.08, 12, 24]} />
            <meshStandardMaterial color="#2C5F5D" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.14, 0.14, 0.05, 18]} />
            <meshStandardMaterial color="#1F1B16" roughness={0.6} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Dissel (tow bar) — cylinder pointing forward */}
      <mesh position={[1.65, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial color="#6B645A" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[1.95, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#1F1B16" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

function shouldEnable() {
  if (typeof window === "undefined") return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return fine && !reduce;
}

export default function Caravan({ className }: { className?: string }) {
  const [enabled] = React.useState(shouldEnable);
  if (!enabled) return null;

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [3.5, 2.2, 4], fov: 35 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[4, 6, 3]}
          intensity={1.2}
          color="#fff0e0"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-3, 2, -2]} color="#C9614F" intensity={0.6} distance={10} />
        <CaravanMesh />
        <ContactShadows
          position={[0, -0.25, 0]}
          opacity={0.25}
          scale={6}
          blur={2.4}
          far={3}
          color="#1F1B16"
        />
      </Canvas>
    </div>
  );
}
