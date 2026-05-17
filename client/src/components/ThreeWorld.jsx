import React, { useRef, useMemo, useState, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text,
  Html,
  MeshReflectorMaterial,
  Float,
  Sparkles,
  Environment,
  Line,
  MeshWobbleMaterial,
  PerspectiveCamera,
  Stars,
  Billboard
} from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  Noise,
  Vignette,
  ChromaticAberration
} from '@react-three/postprocessing';

const DataPacket = ({ start, end, delay }) => {
  const ref = useRef();
  useFrame((state) => {
    const t = ((state.clock.getElapsedTime() + delay) % 4) / 4;
    if (ref.current) {
      ref.current.position.lerpVectors(start, end, t);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshBasicMaterial color="#00ffff" />
    </mesh>
  );
};

const CommitMonolith = ({ position, hash, message, date, index, author, color, onSelect, isSelected }) => {
  const [hovered, setHover] = useState(false);
  const meshRef = useRef();
  
  const height = useMemo(() => 10 + ((message?.length || 0) % 15) * 4, [message]);
  const scale = useMemo(() => 1.5 + Math.random() * 0.5, []);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(time + index) * 0.5;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group 
      position={position} 
      onPointerOver={() => setHover(true)} 
      onPointerOut={() => setHover(false)}
      onClick={() => onSelect({ hash, message, date, author, position, height })}
    >
      {/* Structural Aura */}
      {(hovered || isSelected) && (
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[6 * scale, 6 * scale, height + 10, 32]} />
          <meshBasicMaterial color={isSelected ? "#00ffff" : color} transparent opacity={0.05} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Main Monolith */}
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <octahedronGeometry args={[3 * scale, 4]} />
        <meshStandardMaterial 
          color={isSelected ? "#fff" : "#050505"} 
          emissive={isSelected ? "#00ffff" : (hovered ? "#fff" : color)}
          emissiveIntensity={hovered || isSelected ? 15 : 2}
          metalness={1}
          roughness={0}
        />
        
        {/* Core Wobble */}
        <mesh scale={[0.7, 0.7, 0.7]}>
          <octahedronGeometry args={[2 * scale, 2]} />
          <MeshWobbleMaterial 
            color={color} 
            factor={0.5} 
            speed={3} 
            transparent 
            opacity={0.5}
            emissive={color}
            emissiveIntensity={20}
          />
        </mesh>
      </mesh>

      {/* Label Interface - Billboarded to always face camera */}
      <Billboard position={[0, height + 6, 0]}>
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          <group>
            <Text
              fontSize={hovered || isSelected ? 1.5 : 1.2}
              color="white"
              maxWidth={20}
              textAlign="center"
              anchorY="middle"
              outlineWidth={0.08}
              outlineColor="#000"
            >
              {`${(message || "").substring(0, 45).toUpperCase()}`}
            </Text>
            <Text
              position={[0, -2.5, 0]}
              fontSize={0.8}
              color={color}
              opacity={1}
              fontWeight="bold"
            >
              {`SECTOR: ${(author || "ANONYMOUS").toUpperCase()}`}
            </Text>
          </group>
        </Float>
      </Billboard>

      {isSelected && (
        <pointLight position={[0, height / 2, 0]} color="#00ffff" intensity={100} distance={150} decay={2} />
      )}
    </group>
  );
};

const Scene = ({ commits = [], selectedCommit, onSelectCommit }) => {
  const controlsRef = useRef();

  const commitPositions = useMemo(() => {
    return commits.map((c, i) => {
      const radius = 100 + i * 25;
      const angle = i * 0.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return new THREE.Vector3(x, 0, z);
    });
  }, [commits]);

  const targetCamPos = useRef(new THREE.Vector3(600, 600, 600));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);

  useEffect(() => {
    if (selectedCommit) {
      targetLookAt.current.set(...selectedCommit.position);
      targetCamPos.current.set(
        selectedCommit.position[0] + 120, 
        selectedCommit.height + 80, 
        selectedCommit.position[2] + 120
      );
      isAnimating.current = true;
    } else {
      // When deselected, animate target back to center
      targetLookAt.current.set(0, 0, 0);
      isAnimating.current = true;
    }
  }, [selectedCommit]);

  useFrame((state) => {
    if (controlsRef.current) {
      if (isAnimating.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.05);
        
        if (selectedCommit) {
          state.camera.position.lerp(targetCamPos.current, 0.05);
        }

        // Stop animating when we get close enough, giving control back to the user
        if (
          controlsRef.current.target.distanceTo(targetLookAt.current) < 1 &&
          (!selectedCommit || state.camera.position.distanceTo(targetCamPos.current) < 2)
        ) {
          isAnimating.current = false;
        }
      }

      if (!selectedCommit) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.3;
      } else {
        controlsRef.current.autoRotate = false;
      }
      
      controlsRef.current.update();
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[600, 600, 600]} fov={25} />
      <OrbitControls 
        ref={controlsRef} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={100} 
        maxDistance={3000} 
        enableDamping={true} 
        dampingFactor={0.05} 
        makeDefault
      />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[1000, 2000, 1000]} angle={0.2} penumbra={1} intensity={20} castShadow />
      
      {/* Starfield to fill the "empty" space */}
      <Stars radius={500} depth={100} count={1500} factor={10} saturation={0} fade speed={1} />
      
      {/* Ghost Skyscrapers (Environment Filling) */}
      {[...Array(20)].map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 2000, 100, (Math.random() - 0.5) * 2000]}>
          <boxGeometry args={[20, 200 + Math.random() * 400, 20]} />
          <meshStandardMaterial color="#111" transparent opacity={0.1} wireframe />
        </mesh>
      ))}

      {/* Cyber Grid Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[10000, 10000]} />
        <MeshReflectorMaterial
          blur={[0, 0]}
          resolution={256}
          mixBlur={0}
          mixStrength={100}
          roughness={1}
          color="#020202"
          metalness={0.9}
        />
      </mesh>
      <gridHelper args={[10000, 100, "#112244", "#050a15"]} position={[0, -0.9, 0]} />

      {/* Data Nexus Lines & Packets */}
      {commitPositions.map((pos, i) => {
        if (i === 0) return null;
        return (
          <group key={i}>
            <Line points={[commitPositions[i-1], pos]} color="#00ffff" lineWidth={1} transparent opacity={0.1} />
            <DataPacket start={commitPositions[i-1]} end={pos} delay={i * 0.5} />
          </group>
        );
      })}

      <Sparkles count={400} scale={1500} size={2} speed={0.5} color="#00ffff" />

      <group>
        {commits.map((commit, i) => {
          const color = `hsl(${(commit.author_name?.length || 0) * 137 % 360}, 100%, 70%)`;
          return <CommitMonolith key={commit.hash || i} index={i} position={[commitPositions[i].x, 0, commitPositions[i].z]} hash={commit.hash} message={commit.message} date={commit.date} author={commit.author_name} color={color} onSelect={onSelectCommit} isSelected={selectedCommit?.hash === commit.hash} />;
        })}
      </group>

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom luminanceThreshold={0.85} intensity={1} mipmapBlur />
        <Vignette darkness={0.8} />
        <Noise opacity={0.015} />
      </EffectComposer>

      <Environment preset="night" />
    </>
  );
};

const ThreeWorld = ({ commits = [], selectedCommit, onSelectCommit }) => {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <Canvas shadows dpr={[1, 1.5]}>
        <Suspense fallback={<Html center><div style={{ color: 'white', letterSpacing: '5px' }}>GENERATING SECTORS...</div></Html>}>
          <Scene commits={commits} selectedCommit={selectedCommit} onSelectCommit={onSelectCommit} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeWorld;
