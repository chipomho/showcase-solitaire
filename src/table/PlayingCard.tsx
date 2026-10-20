import { SUIT_COLOURS, SUIT_GLYPHS, rankLabel, type Card, type Rank } from '../game/cards';
import { cx } from './cx';
import styles from './PlayingCard.module.css';

type PipRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Pip = readonly [x: number, y: number];

// Positions in percent of the centre panel. Pips in the lower half are drawn upside down,
// the way a printed card has them.
const PIP_LAYOUTS: Readonly<Record<PipRank, readonly Pip[]>> = {
  2: [[50, 0], [50, 100]],
  3: [[50, 0], [50, 50], [50, 100]],
  4: [[0, 0], [100, 0], [0, 100], [100, 100]],
  5: [[0, 0], [100, 0], [50, 50], [0, 100], [100, 100]],
  6: [[0, 0], [100, 0], [0, 50], [100, 50], [0, 100], [100, 100]],
  7: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [0, 100], [100, 100]],
  8: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [50, 75], [0, 100], [100, 100]],
  9: [[0, 0], [100, 0], [0, 33.3], [100, 33.3], [50, 50], [0, 66.7], [100, 66.7], [0, 100], [100, 100]],
  10: [
    [0, 0], [100, 0], [50, 16.7], [0, 33.3], [100, 33.3],
    [0, 66.7], [100, 66.7], [50, 83.3], [0, 100], [100, 100],
  ],
};

function isPipRank(rank: Rank): rank is PipRank {
  return rank >= 2 && rank <= 10;
}

interface CardCentreProps {
  readonly rank: Rank;
  readonly glyph: string;
  readonly label: string;
}

function CardCentre({ rank, glyph, label }: CardCentreProps) {
  if (isPipRank(rank)) {
    return (
      <span className={styles.pips}>
        {PIP_LAYOUTS[rank].map(([x, y]) => (
          <span
            key={`${x}-${y}`}
            className={cx(styles.pip, y > 50 && styles.inverted)}
            style={{ left: `${x}%`, top: `${y}%` }}
            data-pip=""
          >
            {glyph}
          </span>
        ))}
      </span>
    );
  }
  if (rank === 1) {
    return (
      <span className={styles.ace} data-pip="">
        {glyph}
      </span>
    );
  }
  return (
    <span className={styles.court}>
      <span className={styles.courtLetter}>{label}</span>
      <span className={styles.courtSuit}>{glyph}</span>
    </span>
  );
}

interface PlayingCardProps {
  readonly card: Card;
}

/** The artwork only. Whatever wraps it supplies the accessible name and the behaviour. */
export function PlayingCard({ card }: PlayingCardProps) {
  if (!card.faceUp) {
    return <span className={styles.back} />;
  }

  const glyph = SUIT_GLYPHS[card.suit];
  const label = rankLabel(card.rank);

  return (
    <span className={cx(styles.face, styles[SUIT_COLOURS[card.suit]])}>
      <span className={styles.corner}>
        <span>{label}</span>
        <span className={styles.cornerSuit}>{glyph}</span>
      </span>
      <CardCentre rank={card.rank} glyph={glyph} label={label} />
      <span className={styles.compactSuit}>{glyph}</span>
      <span className={cx(styles.corner, styles.cornerBottom)}>
        <span>{label}</span>
        <span className={styles.cornerSuit}>{glyph}</span>
      </span>
    </span>
  );
}
