"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Float, Stars } from "@react-three/drei";
import { Suspense, useRef, useState, useMemo } from "react";
import * as THREE from "three";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

interface BuildingProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}

function Building({ position, size, color = "#1a1f2e" }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

interface IssueMarkerProps {
  position: [number, number, number];
  severity: "critical" | "high" | "medium" | "low" | "resolved";
  label?: string;
  onClick?: () => void;
}

function IssueMarker({ position, severity, label, onClick }: IssueMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const colors = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
    resolved: "#22c55e",
  };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[hovered ? 0.25 : 0.2, 16, 16]} />
          <meshStandardMaterial
            color={colors[severity]}
            emissive={colors[severity]}
            emissiveIntensity={hovered ? 0.8 : 0.4}
          />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <meshStandardMaterial color={colors[severity]} transparent opacity={0.6} />
        </mesh>
        {hovered && label && (
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
        )}
        <pointLight color={colors[severity]} intensity={0.5} distance={2} />
      </group>
    </Float>
  );
}

interface RoadProps {
  start: [number, number, number];
  end: [number, number, number];
  width?: number;
}

function Road({ start, end, width = 0.15 }: RoadProps) {
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2)
  );
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;

  return (
    <mesh position={[midX, 0.01, midZ]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[length, 0.02, width]} />
      <meshStandardMaterial color="#2a3040" metalness={0.1} roughness={0.9} />
    </mesh>
  );
}

interface CityGridProps {
  size: number;
  divisions: number;
}

function CityGrid({ size, divisions }: CityGridProps) {
  return (
    <group>
      <gridHelper args={[size, divisions, "#2e3548", "#1a1f2e"]} position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0f1419" metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  );
}

interface DataLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}

function DataLine({ start, end, color = "#3b82f6" }: DataLineProps) {
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        Math.max(start[1], end[1]) + 1,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(20);
  }, [start, end]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 }))} />
  );
}

interface JaipurCityProps {
  onIssueClick?: (id: string) => void;
}

function JaipurCity({ onIssueClick }: JaipurCityProps) {
  const groupRef = useRef<THREE.Group>(null);

  const buildings = useMemo(() => {
    const items: BuildingProps[] = [];
    const areas = [
      { name: "Mansarovar", x: -6, z: 4, buildings: 12 },
      { name: "Vaishali Nagar", x: -2, z: 6, buildings: 10 },
      { name: "C-Scheme", x: 2, z: 4, buildings: 14 },
      { name: "Malviya Nagar", x: 6, z: 2, buildings: 11 },
      { name: "Jagatpura", x: 6, z: -2, buildings: 9 },
      { name: "Raja Park", x: 2, z: -2, buildings: 10 },
      { name: "Sodala", x: -2, z: -4, buildings: 8 },
    ];

    areas.forEach((area, areaIndex) => {
      for (let i = 0; i < area.buildings; i++) {
        const offsetX = (Math.sin(i * 1.5) * 1.5);
        const offsetZ = (Math.cos(i * 1.2) * 1.5);
        const seed = areaIndex * 100 + i;
        const height = 0.5 + seededRandom(seed) * 2;
        items.push({
          position: [area.x + offsetX, height / 2, area.z + offsetZ],
          size: [0.3 + seededRandom(seed + 1) * 0.4, height, 0.3 + seededRandom(seed + 2) * 0.4],
          color: `hsl(${220 + seededRandom(seed + 3) * 20}, 10%, ${15 + seededRandom(seed + 4) * 10}%)`,
        });
      }
    });

    return items;
  }, []);

  const issues = useMemo(() => [
    { id: "CE-1042", position: [-6, 2.5, 4] as [number, number, number], severity: "critical" as const },
    { id: "CE-1038", position: [-2, 2, 6] as [number, number, number], severity: "high" as const },
    { id: "CE-1035", position: [2, 2.2, 4] as [number, number, number], severity: "high" as const },
    { id: "CE-1031", position: [6, 2.5, 2] as [number, number, number], severity: "critical" as const },
    { id: "CE-1028", position: [6, 1.8, -2] as [number, number, number], severity: "medium" as const },
    { id: "CE-1025", position: [2, 2.8, -2] as [number, number, number], severity: "critical" as const },
    { id: "CE-1020", position: [-2, 2, -4] as [number, number, number], severity: "resolved" as const },
    { id: "CE-1006", position: [-2, 3, 6] as [number, number, number], severity: "critical" as const },
    { id: "CE-1012", position: [-6, 1.8, 4] as [number, number, number], severity: "medium" as const },
    { id: "CE-1009", position: [2, 2.2, 4] as [number, number, number], severity: "high" as const },
  ], []);

  const roads = useMemo(() => [
    { start: [-8, 0, 0] as [number, number, number], end: [8, 0, 0] as [number, number, number] },
    { start: [0, 0, -8] as [number, number, number], end: [0, 0, 8] as [number, number, number] },
    { start: [-8, 0, 4] as [number, number, number], end: [8, 0, 4] as [number, number, number] },
    { start: [-8, 0, -4] as [number, number, number], end: [8, 0, -4] as [number, number, number] },
    { start: [-4, 0, -8] as [number, number, number], end: [-4, 0, 8] as [number, number, number] },
    { start: [4, 0, -8] as [number, number, number], end: [4, 0, 8] as [number, number, number] },
  ], []);

  return (
    <group ref={groupRef}>
      <CityGrid size={20} divisions={20} />

      {buildings.map((building, i) => (
        <Building key={i} {...building} />
      ))}

      {roads.map((road, i) => (
        <Road key={i} {...road} />
      ))}

      {issues.map((issue) => (
        <IssueMarker
          key={issue.id}
          position={issue.position}
          severity={issue.severity}
          label={issue.id}
          onClick={() => onIssueClick?.(issue.id)}
        />
      ))}

      <DataLine start={[0, 3, 0]} end={[-6, 2.5, 4]} color="#ef4444" />
      <DataLine start={[0, 3, 0]} end={[6, 2.5, 2]} color="#ef4444" />
      <DataLine start={[0, 3, 0]} end={[2, 2.8, -2]} color="#f97316" />
    </group>
  );
}

export function Civic3DScene({ onIssueClick }: { onIssueClick?: (id: string) => void }) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [12, 10, 12], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[0, 8, 0]} intensity={0.5} color="#3b82f6" />

          <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

          <JaipurCity onIssueClick={onIssueClick} />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={8}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={0.5}
          />

          <fog attach="fog" args={["#0f1419", 15, 35]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
