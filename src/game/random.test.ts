import { describe, expect, it } from 'vitest';
import { mulberry32, shuffle } from './random';

describe('mulberry32', () => {
  it('replays the same sequence for the same seed', () => {
    const first = mulberry32(42);
    const second = mulberry32(42);
    const a = Array.from({ length: 5 }, first);
    const b = Array.from({ length: 5 }, second);
    expect(a).toEqual(b);
  });

  it('gives different sequences for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('stays within [0, 1)', () => {
    const random = mulberry32(7);
    for (let i = 0; i < 10_000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  it('returns a permutation and leaves the input alone', () => {
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = shuffle(input, mulberry32(3));
    expect(result).not.toBe(input);
    expect(result.toSorted((a, b) => a - b)).toEqual([...input]);
  });

  it('swaps from the back, each slot with a pick from the front part', () => {
    // With random() always 0, every slot from the end swaps with index 0.
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });

  it('produces every ordering about equally often', () => {
    const random = mulberry32(2024);
    const counts = new Map<string, number>();
    const rounds = 60_000;
    for (let i = 0; i < rounds; i += 1) {
      const key = shuffle(['a', 'b', 'c'], random).join('');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const count of counts.values()) {
      expect(count / (rounds / 6)).toBeCloseTo(1, 1);
    }
  });
});
