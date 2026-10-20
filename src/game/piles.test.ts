import { describe, expect, it } from 'vitest';
import { parsePileId, PILE_IDS, pileLabel, pileName } from './piles';

describe('piles', () => {
  it('has a stock, a waste, four foundations and seven tableau piles', () => {
    expect(PILE_IDS).toHaveLength(13);
    expect(new Set(PILE_IDS).size).toBe(13);
  });

  it('parses only known pile ids', () => {
    expect(parsePileId('tableau-7')).toBe('tableau-7');
    expect(parsePileId('waste')).toBe('waste');
    expect(parsePileId('tableau-8')).toBeNull();
    expect(parsePileId('')).toBeNull();
    expect(parsePileId(undefined)).toBeNull();
  });

  it('names piles for sentences and for labels', () => {
    expect(pileName('foundation-2')).toBe('foundation 2');
    expect(pileName('stock')).toBe('stock');
    expect(pileLabel('tableau-3')).toBe('Tableau 3');
  });
});
