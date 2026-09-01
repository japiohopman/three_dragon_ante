import { create } from 'zustand';
import { GameStore } from './slices/types';
import { getInitialState } from './slices/helpers';
import { createGameSetupSlice } from './slices/gameSetupSlice';
import { createTurnSlice } from './slices/turnSlice';
import { createInteractionSlice } from './slices/interactionSlice';
import { createEconomySlice } from './slices/economySlice';
import { createUISlice } from './slices/uiSlice';

export type { GameStore };

export const useGameStore = create<GameStore>((set, get, api) => ({
  ...getInitialState(),
  ...createGameSetupSlice(set, get, api),
  ...createTurnSlice(set, get, api),
  ...createInteractionSlice(set, get, api),
  ...createEconomySlice(set, get, api),
  ...createUISlice(set, get, api)
}));
