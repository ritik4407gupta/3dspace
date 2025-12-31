import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Hand, Move3d } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/30 rounded-full blur-[120px]" />

      <div className="z-10 container mx-auto px-4 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-xs font-mono mb-6">
            <Sparkles size={12} />
            <span>INTERACTIVE 3D EXPERIENCE</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            Control the Universe<br />
            <span className="text-white">With Your Hands</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience a real-time particle simulation powered by AI hand tracking. 
            Shape galaxies, solar systems, and abstract forms using just your webcam.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              to="/experience"
              className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-cyan-50 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Get Started
              <div className="absolute inset-0 rounded-full ring-2 ring-white/50 group-hover:ring-cyan-400/50 animate-pulse" />
            </Link>
            
            <a href="https://github.com" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all">
              View Source
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Hand className="text-cyan-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Hand Tracking</h3>
              <p className="text-white/50 text-sm">Powered by MediaPipe AI to detect hand gestures in real-time with high precision.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Move3d className="text-purple-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Physics Engine</h3>
              <p className="text-white/50 text-sm">4000+ particles reacting to gravitational forces and your hand's magnetic field.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="text-pink-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Visual Effects</h3>
              <p className="text-white/50 text-sm">Beautiful shapes including a realistic Solar System, Hearts, and Galaxies.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
