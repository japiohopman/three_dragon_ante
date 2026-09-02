import { create } from 'zustand';
import { GameStore } from './slices/types';
import { getInitialState } from './slices/helpers';
import { createGameSetupSlice } from './slices/gameSetupSlice';
import { createAnteSlice } from './slices/anteSlice';
import { createTurnSlice } from './slices/turnSlice';
import { createRoundSlice } from './slices/roundSlice';
import { createInteractionSlice } from './slices/interactionSlice';
import { createEffectSlice } from './slices/effectSlice';
import { createEconomySlice } from './slices/economySlice';
import { createUISlice } from './slices/uiSlice';

export type { GameStore };

export const useGameStore = create<GameStore>((set, get, api) => ({
  ...getInitialState(),
  ...createGameSetupSlice(set, get, api),
  ...createAnteSlice(set, get, api),
  ...createTurnSlice(set, get, api),
  ...createRoundSlice(set, get, api),
  ...createInteractionSlice(set, get, api),
  ...createEffectSlice(set, get, api),
  ...createEconomySlice(set, get, api),
  ...createUISlice(set, get, api)
}));
