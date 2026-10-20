import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { cardNames, heldCards, stack, stock, tableau, topCard } from './test/table';

function visibleCards(): (string | null)[][] {
  return [1, 2, 3, 4, 5, 6, 7].map((column) => cardNames(tableau(column)));
}

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('says plainly that this is an unfinished demo', () => {
    render(<App initialDealNumber={4242} />);
    const banner = screen.getByRole('complementary', { name: 'About this demo' });
    expect(banner).toHaveTextContent('Work in progress.');
    expect(banner).toHaveTextContent('useReducer and context');
    expect(banner).toHaveTextContent('rules of Klondike aren’t implemented yet');
  });

  it('deals n cards to tableau pile n with only the top card showing', () => {
    render(<App initialDealNumber={4242} />);
    for (let column = 1; column <= 7; column += 1) {
      const names = cardNames(tableau(column));
      expect(names).toHaveLength(column);
      expect(names.slice(0, -1).every((name) => name === 'Face-down card')).toBe(true);
      expect(names.at(-1)).not.toBe('Face-down card');
    }
    expect(stock()).toHaveAccessibleName('Stock, 24 cards. Draw a card.');
    expect(stack('Waste')).toHaveAccessibleName('Waste, 0 cards');
    expect(stack('Foundation 1')).toHaveAccessibleName('Foundation 1, 0 cards');
  });

  it('shows the deal number and keeps it in the address bar so the deal can be replayed', () => {
    render(<App initialDealNumber={4242} />);
    expect(screen.getByRole('heading', { name: 'Klondike' })).toBeInTheDocument();
    expect(screen.getByText('#4242')).toBeInTheDocument();
    expect(window.location.search).toBe('?deal=4242');
  });

  it('deals the same cards for the same deal number', () => {
    const { unmount } = render(<App initialDealNumber={4242} />);
    const first = visibleCards();
    unmount();
    render(<App initialDealNumber={4242} />);
    expect(visibleCards()).toEqual(first);
  });

  it('deals a different, freshly numbered game on "New game"', async () => {
    const user = userEvent.setup();
    render(<App initialDealNumber={4242} />);
    const before = visibleCards();
    await user.click(topCard(3));
    expect(heldCards()).toHaveLength(1);

    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    await user.click(screen.getByRole('button', { name: 'New game' }));

    expect(screen.getByText('#250001')).toBeInTheDocument();
    expect(window.location.search).toBe('?deal=250001');
    expect(screen.getByRole('status')).toHaveTextContent('Dealt a new game, number 250001.');
    expect(visibleCards()).not.toEqual(before);
    expect(heldCards()).toEqual([]);
  });
});
