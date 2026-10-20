import { describe, expect, it, vi } from 'vitest';
import { initialDealNumber, MAX_DEAL_NUMBER, parseDealNumber, randomDealNumber } from './dealNumber';

describe('randomDealNumber', () => {
  it('covers 1 to MAX_DEAL_NUMBER inclusive', () => {
    expect(randomDealNumber(() => 0)).toBe(1);
    expect(randomDealNumber(() => 0.999_999_999)).toBe(MAX_DEAL_NUMBER);
  });

  it('uses Math.random by default', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomDealNumber()).toBe(500_001);
  });
});

describe('parseDealNumber', () => {
  it.each(['1', '42', '1000000'])('accepts %s', (value) => {
    expect(parseDealNumber(value)).toBe(Number(value));
  });

  it.each([null, '', '0', '007', '-3', '2.5', '1e3', 'abc', '1000001', '99999999'])('rejects %s', (value) => {
    expect(parseDealNumber(value)).toBeNull();
  });
});

describe('initialDealNumber', () => {
  it('replays the deal named in the query string', () => {
    expect(initialDealNumber('?deal=123')).toBe(123);
  });

  it('falls back to a random deal when there is none, or it is nonsense', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(initialDealNumber('')).toBe(1);
    expect(initialDealNumber('?deal=banana')).toBe(1);
  });
});
