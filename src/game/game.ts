import { assertNever } from './assertNever';
import { createDeck, type Card } from './cards';
import { PILE_IDS, TABLEAU_IDS, type PileId } from './piles';
import { mulberry32, shuffle } from './random';

/** Every pile lists its cards bottom to top, so the last card is the one you see. */
export type Piles = Readonly<Record<PileId, readonly Card[]>>;

export interface GameState {
  readonly dealNumber: number;
  readonly piles: Piles;
}

export type GameAction =
  | { readonly type: 'newGame'; readonly dealNumber: number }
  | { readonly type: 'draw' }
  | { readonly type: 'recycleWaste' }
  | { readonly type: 'moveCards'; readonly from: PileId; readonly index: number; readonly to: PileId };

/** Deals Klondike: tableau pile n gets n cards with only the top one face up; the rest is stock. */
export function deal(dealNumber: number): GameState {
  const deck = shuffle(createDeck(), mulberry32(dealNumber));
  const piles = Object.fromEntries(PILE_IDS.map((id) => [id, [] as Card[]])) as Record<PileId, Card[]>;

  let next = 0;
  TABLEAU_IDS.forEach((id, column) => {
    const size = column + 1;
    piles[id] = deck.slice(next, next + size).map((card, row) => ({ ...card, faceUp: row === size - 1 }));
    next += size;
  });
  piles.stock = deck.slice(next);

  return { dealNumber, piles };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'newGame':
      return deal(action.dealNumber);
    case 'draw':
      return draw(state);
    case 'recycleWaste':
      return recycleWaste(state);
    case 'moveCards':
      return moveCards(state, action.from, action.index, action.to);
    default:
      return assertNever(action);
  }
}

function draw(state: GameState): GameState {
  const { stock, waste } = state.piles;
  const top = stock.at(-1);
  if (top === undefined) {
    return state;
  }
  return withPiles(state, {
    stock: stock.slice(0, -1),
    waste: [...waste, { ...top, faceUp: true }],
  });
}

function recycleWaste(state: GameState): GameState {
  const { stock, waste } = state.piles;
  if (stock.length > 0 || waste.length === 0) {
    return state;
  }
  return withPiles(state, {
    stock: waste.toReversed().map((card) => ({ ...card, faceUp: false })),
    waste: [],
  });
}

/**
 * Moves the card at `index` and everything on top of it. There are deliberately no game
 * rules here, only structural sanity: face-down cards stay put and nothing goes onto the stock.
 */
function moveCards(state: GameState, from: PileId, index: number, to: PileId): GameState {
  if (from === to || to === 'stock' || index < 0) {
    return state;
  }
  const source = state.piles[from];
  const moving = source.slice(index);
  if (moving[0]?.faceUp !== true) {
    return state;
  }

  const remaining = source.slice(0, index);
  const exposed = remaining.at(-1);
  // Turn over whatever the move uncovered, as a player would.
  const left =
    exposed === undefined || exposed.faceUp ? remaining : [...remaining.slice(0, -1), { ...exposed, faceUp: true }];

  return withPiles(state, {
    [from]: left,
    [to]: [...state.piles[to], ...moving],
  });
}

function withPiles(state: GameState, changes: Partial<Piles>): GameState {
  return { ...state, piles: { ...state.piles, ...changes } };
}
