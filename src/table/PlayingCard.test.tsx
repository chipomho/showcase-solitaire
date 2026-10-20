import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RANKS, type Card, type Rank } from '../game/cards';
import { PlayingCard } from './PlayingCard';

function face(rank: Rank, suit: Card['suit'] = 'spades'): Card {
  return { id: `${rank}-${suit}`, rank, suit, faceUp: true };
}

function pips(container: HTMLElement): number {
  return container.querySelectorAll('[data-pip]').length;
}

describe('PlayingCard', () => {
  it('shows nothing but the back when face down', () => {
    const { container } = render(<PlayingCard card={{ ...face(12, 'hearts'), faceUp: false }} />);
    expect(container).toHaveTextContent('');
    expect(pips(container)).toBe(0);
  });

  it('prints the rank and suit in both corners', () => {
    const { container } = render(<PlayingCard card={face(12, 'hearts')} />);
    // Two corner indexes plus the court panel, and the small-card suit.
    expect(container.textContent.match(/Q/g)).toHaveLength(3);
    expect(container.textContent.match(/♥/g)).toHaveLength(4);
  });

  it('draws one large pip on an ace', () => {
    const { container } = render(<PlayingCard card={face(1)} />);
    expect(pips(container)).toBe(1);
  });

  it.each(RANKS.filter((rank) => rank >= 2 && rank <= 10))('draws %i pips on the %i', (rank) => {
    const { container } = render(<PlayingCard card={face(rank, 'diamonds')} />);
    expect(pips(container)).toBe(rank);
  });

  it.each([11, 12, 13] as const)('gives court card %i a panel instead of pips', (rank) => {
    const { container } = render(<PlayingCard card={face(rank, 'clubs')} />);
    expect(pips(container)).toBe(0);
  });
});
