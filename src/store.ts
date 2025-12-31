import { create } from 'zustand';

export type ShapeType = 'sphere' | 'heart' | 'ring' | 'flower' | 'galaxy' | 'solar_system';

interface AppState {
  handPosition: { x: number; y: number; z: number } | null;
  isHandDetected: boolean;
  currentShape: ShapeType;
  setHandPosition: (pos: { x: number; y: number; z: number } | null) => void;
  setHandDetected: (detected: boolean) => void;
  setShape: (shape: ShapeType) => void;
}

export const useStore = create<AppState>((set) => ({
  handPosition: null,
  isHandDetected: false,
  currentShape: 'sphere',
  setHandPosition: (pos) => set({ handPosition: pos }),
  setHandDetected: (detected) => set({ isHandDetected: detected }),
  setShape: (shape) => set({ currentShape: shape }),
}));
