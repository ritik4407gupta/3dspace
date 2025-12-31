import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { getShapeData } from '../utils/shapes';

const COUNT = 4000;
const RADIUS = 3;

const Particles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { handPosition, isHandDetected, currentShape } = useStore();
  
  // Initialize particles
  const { positions, colors, targetPositions, velocities } = useMemo(() => {
    // Initial load (default sphere)
    const { positions: initialTargets, colors: initialColors } = getShapeData('sphere', COUNT, RADIUS);
    
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3); 

    for (let i = 0; i < COUNT; i++) {
      // Random start positions
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

  // Update targets AND colors when shape changes
  useEffect(() => {
    const { positions: newTargets, colors: newColors } = getShapeData(currentShape, COUNT, RADIUS);
    
    // Update target positions reference
    for(let i=0; i<newTargets.length; i++) {
        targetPositions[i] = newTargets[i];
    }

    // Update colors directly on the geometry attribute
    if (pointsRef.current) {
        const colorAttr = pointsRef.current.geometry.attributes.color;
        for(let i=0; i<newColors.length; i++) {
            colorAttr.setX(i, newColors[i]); // R is at index i if we treat it as scalar array? No, setX/Y/Z is for vector3
            // But array is flat. 
            // The safest way for bufferAttribute:
            // @ts-ignore
            colorAttr.array[i] = newColors[i];
        }
        colorAttr.needsUpdate = true;
    }
  }, [currentShape, targetPositions]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position;
    const currentPositions = posAttr.array as Float32Array;

    const time = state.clock.getElapsedTime();
    
    // Physics parameters
    const springStrength = 0.05; 
    const damping = 0.92; 
    const handRepulsionRadius = 3.5; // Increased radius for better interaction
    const handForce = 0.25; // Increased force

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      
      // 1. Seek Target Force
      const tx = targetPositions[i3];
      const ty = targetPositions[i3 + 1];
      const tz = targetPositions[i3 + 2];

      const x = currentPositions[i3];
      const y = currentPositions[i3 + 1];
      const z = currentPositions[i3 + 2];

      // Add some noise/flow based on time
      const noiseX = Math.sin(time * 0.5 + y * 0.5) * 0.02;
      const noiseY = Math.cos(time * 0.3 + x * 0.5) * 0.02;

      let ax = (tx - x) * springStrength + noiseX;
      let ay = (ty - y) * springStrength + noiseY;
      let az = (tz - z) * springStrength;

      // 2. Hand Interaction
      if (isHandDetected && handPosition) {
        const dx = x - handPosition.x;
        const dy = y - handPosition.y;
        const dz = z - handPosition.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        
        if (distSq < handRepulsionRadius * handRepulsionRadius) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / handRepulsionRadius) * handForce;
          
          // Repulse
          ax += dx * force * 8;
          ay += dy * force * 8;
          az += dz * force * 8;

          // Swirl
          ax += -dz * force * 4;
          az += dx * force * 4;
        }
      }

      // 3. Integrate Physics
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
    
    // Rotate the whole system slowly
    pointsRef.current.rotation.y = time * 0.05;
  });

  return (
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
        size={0.12} // Slightly larger particles
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;
