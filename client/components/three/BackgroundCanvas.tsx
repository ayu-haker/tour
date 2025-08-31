import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function FloatingIcos() {
  const group = useRef<THREE.Group>(null!);
  const count = 24;
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 3;
      const a = (i / count) * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      arr.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) group.current.rotation.y = t * 0.1;
  });

  return (
    <group ref={group}>
      {positions.map((p, i) => (
        <mesh key={i} position={p} scale={0.6 + (i % 5) * 0.07}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={new THREE.Color().setHSL(0.6, 0.7, 0.6)} metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function GlowSphere() {
  return (
    <mesh>
      <sphereGeometry args={[3.2, 64, 64]} />
      <meshBasicMaterial color={new THREE.Color("#4f46e5")} wireframe opacity={0.35} transparent />
    </mesh>
  );
}

export function BackgroundCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={["#0b1020"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <GlowSphere />
          <FloatingIcos />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
