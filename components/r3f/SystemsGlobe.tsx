"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Slowly rotating dark-teal globe with a terracotta wireframe overlay
 * and instanced status dots scattered across its surface in a Fibonacci
 * spiral. Each dot represents a "system live somewhere in the world",
 * and the green ones gently pulse so the surface never feels static.
 *
 * Designed for the /status page where the visual reinforces the page's
 * promise (live, distributed, healthy). 47 dots by default — feels
 * populated without being noisy.
 *
 * Performance discipline:
 * - Single low-poly sphere (32 segments) + instanced dots → ~3k tris
 * - frameloop="always" but only the dot scales animate per frame
 * - Skipped on touch / reduced-motion (returns null)
 */

const ATMOSPHERE_VERT = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMOSPHERE_FRAG = `
  uniform vec3 glowColor;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.45 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.7;
  }
`;

const DOT_COUNT = 47;

function GlobeScene() {
  const sphereRef = React.useRef<THREE.Group>(null);
  const dotsRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  // Fibonacci-sphere distribution gives evenly-spaced dots. Math.random
  // would taint useMemo per the purity rule, so we lazy-init via useState.
  const [dotData] = React.useState(() => {
    const phi = (1 + Math.sqrt(5)) / 2;
    return Array.from({ length: DOT_COUNT }, (_, i) => {
      const theta = 2 * Math.PI * (i / phi);
      const phiAngle = Math.acos(1 - (2 * (i + 0.5)) / DOT_COUNT);
      return {
        position: new THREE.Vector3(
          Math.sin(phiAngle) * Math.cos(theta) * 1.02,
          Math.sin(phiAngle) * Math.sin(theta) * 1.02,
          Math.cos(phiAngle) * 1.02,
        ),
        offset: Math.random() * Math.PI * 2,
      };
    });
  });

  useFrame((state, dt) => {
    // Slow rotation — the surface drifts, not spins.
    if (sphereRef.current) sphereRef.current.rotation.y += dt * 0.08;
    if (!dotsRef.current) return;
    dotsRef.current.rotation.y = sphereRef.current?.rotation.y ?? 0;
    const t = state.clock.elapsedTime;
    dotData.forEach((d, i) => {
      const pulse = 1 + Math.sin(t * 1.5 + d.offset) * 0.3;
      dummy.position.copy(d.position);
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      dotsRef.current!.setMatrixAt(i, dummy.matrix);
    });
    dotsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 3, 4]} intensity={1.2} />
      <pointLight position={[-2, -1, 2]} color="#C9614F" intensity={0.4} distance={10} />

      <group ref={sphereRef}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#2C5F5D" roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.005, 32, 32]} />
          <meshBasicMaterial color="#C9614F" wireframe transparent opacity={0.18} />
        </mesh>
      </group>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[1.25, 32, 32]} />
        <shaderMaterial
          uniforms={{ glowColor: { value: new THREE.Color("#C9614F") } }}
          vertexShader={ATMOSPHERE_VERT}
          fragmentShader={ATMOSPHERE_FRAG}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
        />
      </mesh>

      <instancedMesh ref={dotsRef} args={[undefined, undefined, DOT_COUNT]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#5A7A4A" />
      </instancedMesh>
    </>
  );
}

function shouldEnable() {
  if (typeof window === "undefined") return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return fine && !reduce;
}

export default function SystemsGlobe({ className }: { className?: string }) {
  const [enabled] = React.useState(shouldEnable);

  if (!enabled) return null;

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 3.2], fov: 40 }}
      >
        <GlobeScene />
      </Canvas>
    </div>
  );
}
