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
  
  const currentShape = useStore(state => state.currentShape);
  const userName = useStore(state => state.userName);
  
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
    // Pass userName if needed for text generation
    const { positions: newTargets, colors: newColors } = getShapeData(currentShape, COUNT, RADIUS, { text: userName || "USER" });
    
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
  }, [currentShape, targetPositions, userName]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // DIRECT ACCESS: Get state directly without hooks to prevent re-renders
    const { handPosition, isHandDetected, handScale, handRotation } = useStore.getState();

    // Update Cursor Visual
    // Hide cursor if in text mode to avoid confusion since gestures are disabled
    if (cursorRef.current) {
        if (isHandDetected && handPosition && currentShape !== 'text') {
            cursorRef.current.position.lerp(new THREE.Vector3(handPosition.x, handPosition.y, 0), 0.2);
            cursorRef.current.visible = true;
            
            // Pulse effect based on pinch
            const scale = (1 + Math.sin(time * 10) * 0.2) * handScale;
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
    const handRepulsionRadius = 4.0; 
    const handForce = 0.5; 

    const hx = handPosition?.x || 0;
    const hy = handPosition?.y || 0;
    const hz = 0; 
    
    // Pre-calculate rotation matrix for hand rotation gesture
    const cosR = Math.cos(handRotation || 0);
    const sinR = Math.sin(handRotation || 0);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      
      // 1. Get Base Target
      let tx = targetPositions[i3];
      let ty = targetPositions[i3 + 1];
      let tz = targetPositions[i3 + 2];

      // 2. Apply Transforms
      if (currentShape === 'text') {
          // TEXT MODE: 
          // NO Hand Gestures (Scale/Rotation disabled)
          // Automatic gentle wave animation
          
          // Gentle vertical wave
          ty += Math.sin(time * 1.5 + tx * 0.2) * 0.5;
          
          // Gentle Z-depth wave
          tz += Math.cos(time * 1.0 + ty * 0.2) * 0.5;

      } else {
          // OTHER MODES: Hand Gestures Active
          // Scale
          tx *= handScale;
          ty *= handScale;
          tz *= handScale;

          // Rotation (Around Z axis)
          const rx = tx * cosR - ty * sinR;
          const ry = tx * sinR + ty * cosR;
          tx = rx;
          ty = ry;
      }

      const x = currentPositions[i3];
      const y = currentPositions[i3 + 1];
      const z = currentPositions[i3 + 2];

      // Noise (Wavy effect)
      const noiseX = Math.sin(time * 0.5 + y * 0.5) * 0.02;
      const noiseY = Math.cos(time * 0.3 + x * 0.5) * 0.02;

      let ax = (tx - x) * springStrength + noiseX;
      let ay = (ty - y) * springStrength + noiseY;
      let az = (tz - z) * springStrength;

      // 3. Hand Interaction
      // Disable hand interaction completely for text mode
      if (isHandDetected && currentShape !== 'text') {
        const dx = x - hx;
        const dy = y - hy;
        const dz = z - hz;
        
        const distSq = dx * dx + dy * dy + (dz * 0.2) * (dz * 0.2); 
        
        if (distSq < handRepulsionRadius * handRepulsionRadius) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / handRepulsionRadius) * handForce;
          
          ax += dx * force * 15;
          ay += dy * force * 15;
          az += dz * force * 15;

          ax += -dy * force * 5;
          ay += dx * force * 5;
        }
      }

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
    
    // Global Rotation Logic
    if (currentShape !== 'text') {
        // For non-text, auto-rotate if no hand, or stabilize if hand present
        if (!isHandDetected) {
            pointsRef.current.rotation.y = time * 0.05;
        } else {
            pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, 0, 0.05);
        }
    } else {
        // For text, we allow the USER to control view with Mouse (OrbitControls)
        // So we just zero out the container rotation so it faces front by default
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, 0, 0.1);
    }
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

        <mesh ref={cursorRef} visible={false}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
            <pointLight distance={5} intensity={2} color="#00ffff" />
        </mesh>
    </>
  );
};

export default Particles;
