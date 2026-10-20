export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
  readonly faceUp: boolean;
}

export const SUIT_COLOURS: Readonly<Record<Suit, 'red' | 'black'>> = {
  clubs: 'black',
  diamonds: 'red',
  hearts: 'red',
  spades: 'black',
};

// U+FE0E asks for the text presentation, so phones don't swap in emoji hearts.
export const SUIT_GLYPHS: Readonly<Record<Suit, string>> = {
  clubs: '♣︎',
  diamonds: '♦︎',
  hearts: '♥︎',
  spades: '♠︎',
};

const RANK_LABELS: Readonly<Record<Rank, string>> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

const RANK_NAMES: Readonly<Record<Rank, string>> = {
  1: 'Ace',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
};

/** A fresh, ordered, face-down deck. */
export function createDeck(): Card[] {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({ id: `${RANK_LABELS[rank]}-${suit}`, suit, rank, faceUp: false })),
  );
}

export function rankLabel(rank: Rank): string {
  return RANK_LABELS[rank];
}

/** "Queen of hearts" */
export function cardName(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${card.suit}`;
}
