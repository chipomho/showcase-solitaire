import { describe, expect, it } from 'vitest';
import type { Card, Rank, Suit } from './cards';
import { deal, gameReducer, type GameAction, type GameState } from './game';
import { FOUNDATION_IDS, PILE_IDS, TABLEAU_IDS, type PileId } from './piles';

function card(rank: Rank, suit: Suit, faceUp = true): Card {
  return { id: `${rank}-${suit}`, rank, suit, faceUp };
}

function table(piles: Partial<Record<PileId, Card[]>>): GameState {
  const empty = Object.fromEntries(PILE_IDS.map((id) => [id, []])) as unknown as Record<PileId, Card[]>;
  return { dealNumber: 1, piles: { ...empty, ...piles } };
}

describe('deal', () => {
  it('lays out Klondike: n cards in tableau pile n, only the top one face up', () => {
    const { piles } = deal(4242);
    TABLEAU_IDS.forEach((id, column) => {
      const pile = piles[id];
      expect(pile).toHaveLength(column + 1);
      expect(pile.map((c) => c.faceUp)).toEqual([...Array<boolean>(column).fill(false), true]);
    });
  });

  it('leaves the other 24 cards face down in the stock and nothing anywhere else', () => {
    const { piles } = deal(4242);
    expect(piles.stock).toHaveLength(24);
    expect(piles.stock.some((c) => c.faceUp)).toBe(false);
    expect(piles.waste).toEqual([]);
    for (const id of FOUNDATION_IDS) {
      expect(piles[id]).toEqual([]);
    }
  });

  it('uses each card exactly once', () => {
    const ids = PILE_IDS.flatMap((id) => deal(99).piles[id].map((c) => c.id));
    expect(ids).toHaveLength(52);
    expect(new Set(ids).size).toBe(52);
  });

  it('deals the same cards for the same number, and different cards for another', () => {
    expect(deal(31337)).toEqual(deal(31337));
    expect(deal(31337).piles).not.toEqual(deal(31338).piles);
    expect(deal(31337).dealNumber).toBe(31337);
  });
});

describe('gameReducer', () => {
  describe('newGame', () => {
    it('throws the old table away and deals the requested number', () => {
      const played = gameReducer(deal(1), { type: 'draw' });
      expect(gameReducer(played, { type: 'newGame', dealNumber: 2 })).toEqual(deal(2));
    });
  });

  describe('draw', () => {
    it('turns the top of the stock face up onto the waste', () => {
      const state = table({ stock: [card(1, 'clubs', false), card(2, 'clubs', false)], waste: [card(9, 'hearts')] });
      const next = gameReducer(state, { type: 'draw' });
      expect(next.piles.stock).toEqual([card(1, 'clubs', false)]);
      expect(next.piles.waste).toEqual([card(9, 'hearts'), card(2, 'clubs')]);
    });

    it('does nothing when the stock is empty', () => {
      const state = table({ waste: [card(9, 'hearts')] });
      expect(gameReducer(state, { type: 'draw' })).toBe(state);
    });
  });

  describe('recycleWaste', () => {
    it('turns the waste back over, so the stock deals in the same order again', () => {
      const state = table({ waste: [card(1, 'clubs'), card(2, 'clubs'), card(3, 'clubs')] });
      const next = gameReducer(state, { type: 'recycleWaste' });
      expect(next.piles.waste).toEqual([]);
      expect(next.piles.stock).toEqual([card(3, 'clubs', false), card(2, 'clubs', false), card(1, 'clubs', false)]);
      expect(gameReducer(next, { type: 'draw' }).piles.waste).toEqual([card(1, 'clubs')]);
    });

    it('does nothing while the stock still has cards, or when there is no waste', () => {
      const withStock = table({ stock: [card(1, 'clubs', false)], waste: [card(2, 'clubs')] });
      expect(gameReducer(withStock, { type: 'recycleWaste' })).toBe(withStock);
      const bare = table({});
      expect(gameReducer(bare, { type: 'recycleWaste' })).toBe(bare);
    });
  });

  describe('moveCards', () => {
    const move = (from: PileId, index: number, to: PileId): GameAction => ({ type: 'moveCards', from, index, to });

    it('moves the card and everything on top of it, with no rules about where', () => {
      const state = table({
        'tableau-1': [card(13, 'spades')],
        'tableau-2': [card(4, 'hearts', false), card(9, 'clubs'), card(2, 'diamonds')],
      });
      const next = gameReducer(state, move('tableau-2', 1, 'tableau-1'));
      expect(next.piles['tableau-1']).toEqual([card(13, 'spades'), card(9, 'clubs'), card(2, 'diamonds')]);
    });

    it('turns over a face-down card that the move uncovers', () => {
      const state = table({ 'tableau-2': [card(4, 'hearts', false), card(9, 'clubs')] });
      const next = gameReducer(state, move('tableau-2', 1, 'foundation-1'));
      expect(next.piles['tableau-2']).toEqual([card(4, 'hearts')]);
      expect(next.piles['foundation-1']).toEqual([card(9, 'clubs')]);
    });

    it('leaves an uncovered face-up card as it is, and can empty a pile', () => {
      const state = table({ waste: [card(5, 'clubs'), card(6, 'clubs')], 'tableau-3': [card(1, 'hearts')] });
      const fromWaste = gameReducer(state, move('waste', 1, 'tableau-3'));
      expect(fromWaste.piles.waste).toEqual([card(5, 'clubs')]);
      const emptied = gameReducer(fromWaste, move('tableau-3', 0, 'waste'));
      expect(emptied.piles['tableau-3']).toEqual([]);
      expect(emptied.piles.waste).toEqual([card(5, 'clubs'), card(1, 'hearts'), card(6, 'clubs')]);
    });

    it.each([
      ['onto the pile it came from', move('tableau-1', 1, 'tableau-1')],
      ['onto the stock', move('tableau-1', 1, 'stock')],
      ['a face-down card', move('tableau-1', 0, 'tableau-2')],
      ['a card that is not there', move('tableau-1', 5, 'tableau-2')],
      ['from a negative index', move('tableau-1', -1, 'tableau-2')],
      ['out of the face-down stock', move('stock', 0, 'tableau-2')],
    ])('ignores a move %s', (_, action) => {
      const state = table({ stock: [card(7, 'spades', false)], 'tableau-1': [card(4, 'hearts', false), card(9, 'clubs')] });
      expect(gameReducer(state, action)).toBe(state);
    });
  });

  it('refuses an action it does not know', () => {
    const bogus = { type: 'undo' } as unknown as GameAction;
    expect(() => gameReducer(deal(1), bogus)).toThrow('Unhandled value: {"type":"undo"}');
  });
});
