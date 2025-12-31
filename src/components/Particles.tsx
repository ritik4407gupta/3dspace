import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { getShapeData } from '../utils/shapes';

const COUNT = 4000;
const RADIUS = 3;

const Particles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const cursorRef = useRef<THREE.Mesh>(null);
  
  // SELECTORS: Only subscribe to things that should trigger a re-render (like shape change)
  // We DO NOT subscribe to handPosition here to avoid 60fps re-renders
  const currentShape = useStore(state => state.currentShape);
  
  // Initialize particles
  const { positions, colors, targetPositions, velocities } = useMemo(() => {
    const { positions: initialTargets, colors: initialColors } = getShapeData('sphere', COUNT, RADIUS);
    
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3); 

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }

    return { 
        positions, 
        colors: initialColors, 
        targetPositions: initialTargets, 
        velocities 
    };
  }, []); 

  // Update targets when shape changes
  useEffect(() => {
    const { positions: newTargets, colors: newColors } = getShapeData(currentShape, COUNT, RADIUS);
    
    for(let i=0; i<newTargets.length; i++) {
        targetPositions[i] = newTargets[i];
    }

    if (pointsRef.current) {
        const colorAttr = pointsRef.current.geometry.attributes.color;
        for(let i=0; i<newColors.length; i++) {
            // @ts-ignore
            colorAttr.array[i] = newColors[i];
        }
        colorAttr.needsUpdate = true;
    }
  }, [currentShape, targetPositions]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // DIRECT ACCESS: Get state directly without hooks to prevent re-renders
    const { handPosition, isHandDetected } = useStore.getState();

    // Update Cursor Visual
    if (cursorRef.current) {
        if (isHandDetected && handPosition) {
            // Smoothly interpolate cursor position
            cursorRef.current.position.lerp(new THREE.Vector3(handPosition.x, handPosition.y, 0), 0.2);
            cursorRef.current.visible = true;
            
            // Pulse effect
            const scale = 1 + Math.sin(time * 10) * 0.2;
            cursorRef.current.scale.set(scale, scale, scale);
        } else {
            cursorRef.current.visible = false;
        }
    }

    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position;
    const currentPositions = posAttr.array as Float32Array;
    
    // Physics parameters
    const springStrength = 0.05; 
    const damping = 0.92; 
    const handRepulsionRadius = 4.0; // Large radius
    const handForce = 0.5; // Strong force

    // Use local variables for hand pos to avoid lookups in loop
    const hx = handPosition?.x || 0;
    const hy = handPosition?.y || 0;
    // Force Z to 0 for planar interaction (Screen space -> 3D Plane)
    const hz = 0; 

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      
      // 1. Seek Target
      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      const x = currentPositions[i3];
      const y = currentPositions[i3 + 1];
      const z = currentPositions[i3 + 2];

      // Noise
      const noiseX = Math.sin(time * 0.5 + y * 0.5) * 0.02;
      const noiseY = Math.cos(time * 0.3 + x * 0.5) * 0.02;

      let ax = (tx - x) * springStrength + noiseX;
      let ay = (ty - y) * springStrength + noiseY;
      let az = (tz - z) * springStrength;

      // 2. Hand Interaction
      if (isHandDetected) {
        const dx = x - hx;
        const dy = y - hy;
        const dz = z - hz;
        
        // Calculate distance but ignore Z for "Cylinder" interaction field
        // This makes it feel like touching a screen regardless of particle depth
        const distSq = dx * dx + dy * dy + (dz * 0.2) * (dz * 0.2); 
        
        if (distSq < handRepulsionRadius * handRepulsionRadius) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / handRepulsionRadius) * handForce;
          
          // Repulse outwards
          ax += dx * force * 15;
          ay += dy * force * 15;
          az += dz * force * 15;

          // Add swirl/curl noise
          ax += -dy * force * 5;
          ay += dx * force * 5;
        }
      }

      // 3. Integrate
      velocities[i3] += ax;
      velocities[i3 + 1] += ay;
      velocities[i3 + 2] += az;

      velocities[i3] *= damping;
      velocities[i3 + 1] *= damping;
      velocities[i3 + 2] *= damping;

      currentPositions[i3] += velocities[i3];
      currentPositions[i3 + 1] += velocities[i3 + 1];
      currentPositions[i3 + 2] += velocities[i3 + 2];
    }

    posAttr.needsUpdate = true;
    pointsRef.current.rotation.y = time * 0.05;
  });

  return (
    <>
        <points ref={pointsRef}>
        <bufferGeometry>
            <bufferAttribute
            attach="attributes-position"
            count={COUNT}
            array={positions}
            itemSize={3}
            />
            <bufferAttribute
            attach="attributes-color"
            count={COUNT}
            array={colors}
            itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial
            size={0.15}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
        </points>

        {/* Visual Cursor Feedback */}
        <mesh ref={cursorRef} visible={false}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
            <pointLight distance={5} intensity={2} color="#00ffff" />
        </mesh>
    </>
  );
};

export default Particles;
