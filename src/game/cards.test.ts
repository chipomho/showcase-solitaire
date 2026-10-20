import { describe, expect, it } from 'vitest';
import { cardName, createDeck, rankLabel, SUITS } from './cards';

describe('createDeck', () => {
  it('holds 52 distinct cards, thirteen of each suit, all face down', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
    for (const suit of SUITS) {
      expect(deck.filter((card) => card.suit === suit)).toHaveLength(13);
    }
    expect(deck.every((card) => !card.faceUp)).toBe(true);
  });
});

describe('card names', () => {
  it('reads the way a person would say them', () => {
    expect(cardName({ id: 'Q-hearts', suit: 'hearts', rank: 12, faceUp: true })).toBe('Queen of hearts');
    expect(cardName({ id: 'A-spades', suit: 'spades', rank: 1, faceUp: false })).toBe('Ace of spades');
    expect(cardName({ id: '10-clubs', suit: 'clubs', rank: 10, faceUp: true })).toBe('Ten of clubs');
  });

  it('uses the corner letters for court cards and aces', () => {
    expect([1, 7, 10, 11, 12, 13].map((rank) => rankLabel(rank as 1))).toEqual(['A', '7', '10', 'J', 'Q', 'K']);
  });
});
