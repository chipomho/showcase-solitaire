/** Deal numbers run from 1 to a million: short enough to read out, plenty of distinct games. */
export const MAX_DEAL_NUMBER = 1_000_000;

export function randomDealNumber(random: () => number = Math.random): number {
  return 1 + Math.floor(random() * MAX_DEAL_NUMBER);
}

export function parseDealNumber(value: string | null): number | null {
  if (value === null || !/^[1-9]\d{0,6}$/.test(value)) {
    return null;
  }
  const dealNumber = Number(value);
  return dealNumber <= MAX_DEAL_NUMBER ? dealNumber : null;
}

/** `?deal=123` replays a specific deal; anything else gets a random one. */
export function initialDealNumber(search: string): number {
  return parseDealNumber(new URLSearchParams(search).get('deal')) ?? randomDealNumber();
}
