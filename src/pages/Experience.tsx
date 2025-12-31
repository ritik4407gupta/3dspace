import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Particles from '../components/Particles';
import HandTracker from '../components/HandTracker';
import UI from '../components/UI';

const Experience: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 15], fov: 45 }}
          gl={{ antialias: false, alpha: false }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#050505']} />
          
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Particles />
          </Suspense>
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate={false}
            enableDamping
            dampingFactor={0.05}
            maxDistance={30}
            minDistance={5}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <UI />
      </div>

      {/* Hand Tracker */}
      <HandTracker />
    </div>
  );
}

export default Experience;
