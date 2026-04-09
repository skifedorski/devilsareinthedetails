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
  // True only after the opening text's exit animation has fully completed.
  introReady: boolean;
  setScene: (scene: SceneState) => void;
  setIntroReady: () => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  scene: 'loading',
  introReady: false,
  setScene: (scene) => set({ scene }),
  setIntroReady: () => set({ introReady: true }),
}));
