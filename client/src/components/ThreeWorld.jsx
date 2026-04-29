import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Grid, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

const CommitBuilding = ({ position, commit, index }) => {
  const mesh = useRef();
  
  // Size based on commit impact (mocking it for now as lines changed)
  const height = useMemo(() => Math.max(1, (commit.message.length / 10)), [commit]);
  
  return (
    <group position={position}>
      <mesh ref={mesh} position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color={index % 2 === 0 ? "#00f2ff" : "#7000ff"} emissive={index % 2 === 0 ? "#00f2ff" : "#7000ff"} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Text
          position={[0, height + 0.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/orbitron/v25/yYqxRneDgc0b7_9371_lT17_8O7f.woff"
        >
          {commit.message.substring(0, 15)}...
        </Text>
      </Float>
    </group>
  );
};

const ThreeWorld = ({ commits }) => {
  return (
    <Canvas shadows>
      <OrthographicCamera
        makeDefault
        position={[20, 20, 20]}
        zoom={40}
        near={0.1}
        far={1000}
      />
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[0, 0, 0]}
      />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} castShadow intensity={1} />
      <directionalLight position={[-10, 20, 10]} intensity={1.5} castShadow />

      <Grid
        infiniteGrid
        fadeDistance={50}
        fadeStrength={5}
        cellSize={1}
        sectionSize={5}
        sectionColor="#7000ff"
        cellColor="#00f2ff"
      />

      {commits.map((commit, i) => {
        // Grid-like placement for now
        const x = (i % 5) * 3 - 6;
        const z = Math.floor(i / 5) * 3 - 6;
        return <CommitBuilding key={commit.hash} position={[x, 0, z]} commit={commit} index={i} />;
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0a0b1e" transparent opacity={0.5} />
      </mesh>
    </Canvas>
  );
};

export default ThreeWorld;
