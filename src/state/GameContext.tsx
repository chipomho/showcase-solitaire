import { createContext, use, useReducer, type Dispatch, type ReactNode } from 'react';
import { deal, gameReducer, type GameAction, type GameState } from '../game/game';

// State and dispatch travel separately so components that only send actions don't
// re-render on every move.
const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

interface GameProviderProps {
  readonly initialDealNumber: number;
  readonly children: ReactNode;
}

export function GameProvider({ initialDealNumber, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialDealNumber, deal);
  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>{children}</GameDispatchContext>
    </GameStateContext>
  );
}

export function useGameState(): GameState {
  const state = use(GameStateContext);
  if (state === null) {
    throw new Error('useGameState must be called inside <GameProvider>.');
  }
  return state;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const dispatch = use(GameDispatchContext);
  if (dispatch === null) {
    throw new Error('useGameDispatch must be called inside <GameProvider>.');
  }
  return dispatch;
}
