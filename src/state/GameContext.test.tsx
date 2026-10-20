import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameProvider, useGameDispatch, useGameState } from './GameContext';

describe('GameContext', () => {
  it('hands out the dealt game and a dispatch inside the provider', () => {
    const { result } = renderHook(() => ({ state: useGameState(), dispatch: useGameDispatch() }), {
      wrapper: ({ children }) => <GameProvider initialDealNumber={5}>{children}</GameProvider>,
    });
    expect(result.current.state.dealNumber).toBe(5);
    expect(result.current.dispatch).toBeTypeOf('function');
  });

  it('fails loudly when used outside the provider', () => {
    // React reports the render error on the console as well as throwing it.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useGameState())).toThrow('inside <GameProvider>');
    expect(() => renderHook(() => useGameDispatch())).toThrow('inside <GameProvider>');
  });
});
