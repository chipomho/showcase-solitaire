import type { Card } from '../game/cards';
import { PlayingCard } from './PlayingCard';
import styles from './Table.module.css';

interface DragPreviewProps {
  readonly cards: readonly Card[];
  readonly x: number;
  readonly y: number;
}

/**
 * The cards in hand while a drag is under way. The originals stay mounted (and keep the
 * pointer capture) but turn transparent; this copy follows the pointer and ignores hits.
 */
export function DragPreview({ cards, x, y }: DragPreviewProps) {
  return (
    <div
      className={styles.preview}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      aria-hidden="true"
      data-testid="drag-preview"
    >
      <ol className={styles.fan}>
        {cards.map((card) => (
          <li key={card.id} data-face="up">
            <span className={styles.card}>
              <PlayingCard card={card} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
