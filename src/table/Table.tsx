import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { cardName, type Card } from '../game/cards';
import { FOUNDATION_IDS, pileName, TABLEAU_IDS, type PileId } from '../game/piles';
import { useGameDispatch, useGameState } from '../state/GameContext';
import { DragPreview } from './DragPreview';
import { StackedPile, StockPile, TableauPile, type CardButtonProps, type PileProps } from './Piles';
import styles from './Table.module.css';
import { useCardDrag } from './useCardDrag';

/** Cards picked up by a click or the keyboard: the card at `index` and everything on it. */
interface Selection {
  readonly from: PileId;
  readonly index: number;
  readonly cardId: string;
}

const cardList = new Intl.ListFormat('en-AU', { type: 'conjunction' });

function describeCards(cards: readonly Card[]): string {
  return cardList.format(cards.map(cardName));
}

interface TableProps {
  /** Text for the page's live region, so screen readers hear what changed. */
  readonly onAnnounce: (message: string) => void;
}

export function Table({ onAnnounce }: TableProps) {
  const { piles } = useGameState();
  const dispatch = useGameDispatch();
  const [held, setHeld] = useState<Selection | null>(null);
  const [focusCardId, setFocusCardId] = useState<string | null>(null);
  const { drag, pointerHandlers, isClickAfterDrag } = useCardDrag(moveCards);

  function moveCards(from: PileId, index: number, to: PileId) {
    dispatch({ type: 'moveCards', from, index, to });
    setHeld(null);
    onAnnounce(`Moved ${describeCards(piles[from].slice(index))} to ${pileName(to)}.`);
  }

  function putDownHeld(selection: Selection, to: PileId) {
    moveCards(selection.from, selection.index, to);
    setFocusCardId(selection.cardId);
  }

  function putBack() {
    setHeld(null);
    onAnnounce('Put the cards back.');
  }

  function handleCardClick(event: MouseEvent<HTMLElement>, pile: PileId, index: number, card: Card) {
    if (isClickAfterDrag(event)) {
      return;
    }
    if (held === null) {
      setHeld({ from: pile, index, cardId: card.id });
      onAnnounce(
        `Picked up ${describeCards(piles[pile].slice(index))}. Choose a pile, or press Escape to cancel.`,
      );
    } else if (held.from === pile) {
      putBack();
    } else {
      putDownHeld(held, pile);
    }
  }

  function handleEmptyPileClick(pile: PileId) {
    if (held !== null) {
      putDownHeld(held, pile);
    }
  }

  function handleStockClick() {
    setHeld(null);
    const top = piles.stock.at(-1);
    if (top === undefined) {
      dispatch({ type: 'recycleWaste' });
      onAnnounce('Turned the waste back over onto the stock.');
    } else {
      dispatch({ type: 'draw' });
      onAnnounce(`Drew the ${cardName(top)}.`);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && held !== null) {
      putBack();
    }
  }

  const lifted = drag.phase === 'dragging' ? drag.grab : null;
  const hoverTarget = drag.phase === 'dragging' && drag.over !== drag.grab.from ? drag.over : null;

  function pileProps(id: PileId): PileProps {
    return {
      id,
      cards: piles[id],
      dropHover: hoverTarget === id,
      getCardProps: (index: number, card: Card): CardButtonProps => ({
        card,
        lifted: lifted?.from === id && index >= lifted.index,
        held: held?.from === id && index >= held.index,
        pressed: held?.from === id && index === held.index,
        autoFocus: card.id === focusCardId,
        handlers: {
          ...pointerHandlers(id, index),
          onClick: (event) => {
            handleCardClick(event, id, index, card);
          },
        },
      }),
      onEmptyClick: () => {
        handleEmptyPileClick(id);
      },
    };
  }

  return (
    <section className={styles.table} aria-label="Card table" onKeyDown={handleKeyDown}>
      <div className={styles.upper}>
        <StockPile cards={piles.stock} onClick={handleStockClick} />
        <StackedPile {...pileProps('waste')} />
        <div className={styles.foundations}>
          {FOUNDATION_IDS.map((id) => (
            <StackedPile key={id} {...pileProps(id)} />
          ))}
        </div>
      </div>
      <div className={styles.tableau}>
        {TABLEAU_IDS.map((id) => (
          <TableauPile key={id} {...pileProps(id)} />
        ))}
      </div>
      {drag.phase === 'dragging' && (
        <DragPreview
          cards={piles[drag.grab.from].slice(drag.grab.index)}
          x={drag.x - drag.grab.offsetX}
          y={drag.y - drag.grab.offsetY}
        />
      )}
    </section>
  );
}
