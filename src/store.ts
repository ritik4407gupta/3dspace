import { create } from 'zustand';

export type ShapeType = 'sphere' | 'heart' | 'ring' | 'flower' | 'galaxy' | 'solar_system' | 'text';

interface AppState {
  handPosition: { x: number; y: number; z: number } | null;
  isHandDetected: boolean;
  currentShape: ShapeType;
  userName: string;
  
  // Gesture States
  handScale: number;
  handRotation: number; // in radians

  setHandPosition: (pos: { x: number; y: number; z: number } | null) => void;
  setHandDetected: (detected: boolean) => void;
  setShape: (shape: ShapeType) => void;
  setUserName: (name: string) => void;
  setGestureState: (scale: number, rotation: number) => void;
}

export const useStore = create<AppState>((set) => ({
  handPosition: null,
  isHandDetected: false,
  currentShape: 'sphere',
  userName: '',
  handScale: 1,
  handRotation: 0,

  setHandPosition: (pos) => set({ handPosition: pos }),
  setHandDetected: (detected) => set({ isHandDetected: detected }),
  setShape: (shape) => set({ currentShape: shape }),
  setUserName: (name) => set({ userName: name }),
  setGestureState: (scale, rotation) => set({ handScale: scale, handRotation: rotation }),
}));
