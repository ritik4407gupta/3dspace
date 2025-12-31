import React from 'react';
import { useStore, ShapeType } from '../store';
import { motion } from 'framer-motion';
import { Heart, Circle, Disc, Flower2, Sparkles, Orbit, ArrowLeft, Type } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const shapes: { id: ShapeType; icon: React.ElementType; label: string }[] = [
  { id: 'sphere', icon: Circle, label: 'Sphere' },
  { id: 'heart', icon: Heart, label: 'Heart' },
  { id: 'ring', icon: Disc, label: 'Saturn' },
  { id: 'flower', icon: Flower2, label: 'Flower' },
  { id: 'galaxy', icon: Sparkles, label: 'Galaxy' },
  { id: 'solar_system', icon: Orbit, label: 'Solar Sys' },
];

const UI: React.FC = () => {
  const { currentShape, setShape, isHandDetected, userName } = useStore();

  // Add Name option dynamically if user has a name
  // FIX: Increased slice to 8 to match input limit
  const displayShapes = userName 
    ? [...shapes, { id: 'text' as ShapeType, icon: Type, label: userName.slice(0, 8) }] 
    : shapes;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 z-50">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="pointer-events-auto">
            <Link to="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-2 text-sm">
                <ArrowLeft size={16} /> Back to Home
            </Link>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tighter drop-shadow-lg">
                Particle<span className="text-cyan-400">Flow</span>
            </h1>
        </div>
        
        <div className={clsx(
          "px-4 py-2 rounded-full backdrop-blur-md border transition-colors duration-300 self-start sm:self-auto sm:mr-auto sm:ml-8",
          isHandDetected 
            ? "bg-green-500/20 border-green-500/50 text-green-300" 
            : "bg-red-500/20 border-red-500/50 text-red-300"
        )}>
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className={clsx("w-2 h-2 rounded-full", isHandDetected ? "bg-green-400 animate-pulse" : "bg-red-400")} />
            {isHandDetected ? "Hand Detected" : "No Hand Detected"}
          </span>
        </div>
      </div>

      <div className="pointer-events-auto w-full overflow-x-auto pb-4 sm:pb-0">
        <div className="flex sm:justify-center min-w-max sm:min-w-0 gap-2 sm:gap-4 px-2">
          <div className="flex gap-2 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
            {displayShapes.map((shape) => {
              const Icon = shape.icon;
              const isActive = currentShape === shape.id;
              
              return (
                <motion.button
                  key={shape.id}
                  onClick={() => setShape(shape.id)}
                  className={clsx(
                    "relative flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl transition-all duration-300 group shrink-0",
                    isActive ? "bg-white/10 text-cyan-400" : "hover:bg-white/5 text-white/50 hover:text-white"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={20} className={clsx("mb-1 sm:mb-2 transition-transform duration-300", isActive && "scale-110")} />
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider truncate max-w-full px-1">{shape.label}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 border-2 border-cyan-400/50 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UI;
