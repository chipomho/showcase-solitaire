import { useState } from 'react';
import styles from './App.module.css';
import { randomDealNumber } from './game/dealNumber';
import { GameProvider, useGameDispatch, useGameState } from './state/GameContext';
import { useDealNumberInUrl } from './state/useDealNumberInUrl';
import { Table } from './table/Table';

interface AppProps {
  readonly initialDealNumber: number;
}

export function App({ initialDealNumber }: AppProps) {
  return (
    <GameProvider initialDealNumber={initialDealNumber}>
      <Solitaire />
    </GameProvider>
  );
}

function Solitaire() {
  const { dealNumber } = useGameState();
  const dispatch = useGameDispatch();
  const [announcement, setAnnouncement] = useState('');
  useDealNumberInUrl(dealNumber);

  function startNewGame() {
    const next = randomDealNumber();
    dispatch({ type: 'newGame', dealNumber: next });
    setAnnouncement(`Dealt a new game, number ${next}.`);
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Klondike</h1>
        <p className={styles.deal}>
          Deal <strong>#{dealNumber}</strong>
        </p>
        <button type="button" className={styles.newGame} onClick={startNewGame}>
          New game
        </button>
      </header>

      <aside className={styles.banner} aria-label="About this demo">
        <span className={styles.bannerIcon} aria-hidden="true">
          i
        </span>
        <p>
          <strong>Work in progress.</strong> This table demonstrates layout, a seeded shuffle and drag and drop,
          built with plain React state (useReducer and context). The rules of Klondike aren&rsquo;t implemented yet,
          so any card can go on any pile and nothing is scored.
        </p>
      </aside>

      <main>
        {/* A fresh table per deal, so no half-finished drag or selection carries over. */}
        <Table key={dealNumber} onAnnounce={setAnnouncement} />
      </main>

      <p className={styles.hint}>
        Drag a face-up card, with anything on top of it, onto another pile. Or click a card (Enter on the keyboard),
        then the pile it should go to. Escape puts it back.
      </p>

      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </div>
  );
}
