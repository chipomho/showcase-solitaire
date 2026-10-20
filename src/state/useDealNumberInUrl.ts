import { useEffect } from 'react';

/** Keeps `?deal=` in the address bar in step with the game, so the link replays the deal. */
export function useDealNumberInUrl(dealNumber: number): void {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('deal', String(dealNumber));
    window.history.replaceState(window.history.state, '', url);
  }, [dealNumber]);
}
