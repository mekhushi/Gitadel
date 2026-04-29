import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    st.x *= uResolution.x / uResolution.y;

    vec2 mouse = uMouse / uResolution.xy;
    mouse.x *= uResolution.x / uResolution.y;

    float d = distance(st, mouse);
    float ripple = sin(d * 20.0 - uTime * 4.0) * exp(-d * 3.0);
    
    vec3 color = vec3(0.02, 0.02, 0.05); // Deep base
    
    // Organic fluid motion
    float noise = sin(st.x * 10.0 + uTime) * cos(st.y * 10.0 + uTime);
    color += vec3(0.1, 0.1, 0.2) * noise;
    
    // Reactive highlights
    float glow = 0.05 / d;
    color += vec3(0.5, 0.5, 0.8) * glow * ripple;
    
    // Vignette
    float v = 1.0 - smoothstep(0.5, 1.5, length(st - 0.5));
    color *= v;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const ShaderPlane = () => {
  const mesh = useRef();
  const { size } = useThree();
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) }
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uMouse.value.lerp(new THREE.Vector2(state.mouse.x * size.width, state.mouse.y * size.height), 0.1);
    uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const InitBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas>
        <ShaderPlane />
      </Canvas>
    </div>
  );
};

export default InitBackground;
