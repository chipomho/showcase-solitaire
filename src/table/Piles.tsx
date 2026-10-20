import type { MouseEvent } from 'react';
import { cardName, type Card } from '../game/cards';
import { pileLabel, pileName, type PileId } from '../game/piles';
import { PlayingCard } from './PlayingCard';
import styles from './Table.module.css';
import type { CardPointerHandlers } from './useCardDrag';

export interface CardHandlers extends CardPointerHandlers {
  onClick(event: MouseEvent<HTMLElement>): void;
}

export interface CardButtonProps {
  readonly card: Card;
  /** Picked up by the pointer and travelling with the drag preview. */
  readonly lifted: boolean;
  /** Picked up by a click or the keyboard, waiting for a destination. */
  readonly held: boolean;
  /** The card that was picked up, as opposed to the ones riding on it. */
  readonly pressed: boolean;
  readonly autoFocus: boolean;
  readonly handlers: CardHandlers;
}

export function CardButton({ card, lifted, held, pressed, autoFocus, handlers }: CardButtonProps) {
  return (
    <button
      type="button"
      className={styles.card}
      aria-label={cardName(card)}
      aria-pressed={pressed}
      data-lifted={lifted || undefined}
      data-held={held || undefined}
      // Focus follows a card that the keyboard just moved, because moving remounts it.
      autoFocus={autoFocus}
      {...handlers}
    >
      <PlayingCard card={card} />
    </button>
  );
}

function FaceDownCard({ card }: { readonly card: Card }) {
  return (
    <span role="img" aria-label="Face-down card" className={styles.card}>
      <PlayingCard card={card} />
    </span>
  );
}

function EmptyPileButton({ id, onClick }: { readonly id: PileId; readonly onClick: () => void }) {
  return (
    <button type="button" className={styles.emptyPile} aria-label={`Empty ${pileName(id)}`} onClick={onClick} />
  );
}

export function countCards(count: number): string {
  return `${count} ${count === 1 ? 'card' : 'cards'}`;
}

export interface PileProps {
  readonly id: PileId;
  readonly cards: readonly Card[];
  readonly dropHover: boolean;
  readonly getCardProps: (index: number, card: Card) => CardButtonProps;
  readonly onEmptyClick: () => void;
}

/** A tableau column: cards fanned downwards, every face-up card can be picked up. */
export function TableauPile({ id, cards, dropHover, getCardProps, onEmptyClick }: PileProps) {
  return (
    <div className={styles.column} data-drop-target={id} data-drop-hover={dropHover || undefined}>
      {cards.length === 0 ? (
        <EmptyPileButton id={id} onClick={onEmptyClick} />
      ) : (
        <ol className={styles.fan} aria-label={pileLabel(id)}>
          {cards.map((card, index) => (
            <li key={card.id} data-face={card.faceUp ? 'up' : 'down'}>
              {card.faceUp ? <CardButton {...getCardProps(index, card)} /> : <FaceDownCard card={card} />}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Waste and foundations: squared-up piles where only the top card shows. */
export function StackedPile({ id, cards, dropHover, getCardProps, onEmptyClick }: PileProps) {
  const topIndex = cards.length - 1;
  const top = cards[topIndex];
  // The card underneath is drawn too, so lifting the top one reveals something real.
  const under = cards[topIndex - 1];

  return (
    <div
      role="group"
      aria-label={`${pileLabel(id)}, ${countCards(cards.length)}`}
      className={styles.stack}
      data-drop-target={id}
      data-drop-hover={dropHover || undefined}
    >
      {under !== undefined && (
        <span key={under.id} className={styles.card} aria-hidden="true">
          <PlayingCard card={under} />
        </span>
      )}
      {/* Keyed by card, so a new top card is a new element rather than a recycled one. */}
      {top === undefined ? (
        <EmptyPileButton id={id} onClick={onEmptyClick} />
      ) : (
        <CardButton key={top.id} {...getCardProps(topIndex, top)} />
      )}
    </div>
  );
}

interface StockPileProps {
  readonly cards: readonly Card[];
  readonly onClick: () => void;
}

/** Not a drop target, so it carries no data-drop-target: cards only leave the stock. */
export function StockPile({ cards, onClick }: StockPileProps) {
  const top = cards.at(-1);
  return (
    <div className={styles.stack}>
      <button
        type="button"
        className={styles.stock}
        aria-label={
          top === undefined
            ? 'Stock, empty. Turn the waste back over.'
            : `Stock, ${countCards(cards.length)}. Draw a card.`
        }
        onClick={onClick}
      >
        {top === undefined ? (
          <span className={styles.recycle} aria-hidden="true">
            {'↻'}
          </span>
        ) : (
          <span className={styles.card}>
            <PlayingCard card={top} />
          </span>
        )}
      </button>
    </div>
  );
}
