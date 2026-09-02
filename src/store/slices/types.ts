import { GameState } from '../../types';
import { GameSetupSlice } from './gameSetupSlice';
import { AnteSlice } from './anteSlice';
import { TurnSlice } from './turnSlice';
import { RoundSlice } from './roundSlice';
import { InteractionSlice } from './interactionSlice';
import { EffectSlice } from './effectSlice';
import { EconomySlice } from './economySlice';
import { UISlice } from './uiSlice';

export interface GameStore extends GameState,
  GameSetupSlice,
  AnteSlice,
  TurnSlice,
  RoundSlice,
  InteractionSlice,
  EffectSlice,
  EconomySlice,
  UISlice {}
