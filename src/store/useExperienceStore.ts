import { create } from 'zustand';

export type SceneState = 
  | 'loading'     // 0
  | 'opening'     // 1
  | 'heart'       // 2
  | 'reflection'  // 3
  | 'outro'       // 4
  | 'stillness';  // 5

interface ExperienceState {
  scene: SceneState;
  scrollCount: number;
  setScene: (scene: SceneState) => void;
  incrementScroll: () => void;
  resetScroll: () => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  scene: 'loading',
  scrollCount: 0,
  setScene: (scene) => set({ scene }),
  incrementScroll: () => set((state) => ({ scrollCount: state.scrollCount + 1 })),
  resetScroll: () => set({ scrollCount: 0 }),
}));