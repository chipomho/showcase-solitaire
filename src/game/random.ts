/**
 * mulberry32: a tiny 32-bit PRNG. Fast and well distributed, which is all a card shuffle
 * needs. It is not cryptographically secure and is not meant to be.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Durstenfeld's in-place Fisher-Yates, run over a copy so the input is left alone. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    // Both indexes are in bounds by construction; the casts only undo noUncheckedIndexedAccess.
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
