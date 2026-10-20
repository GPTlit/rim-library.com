/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { COMMENT_HOLD_MS, mascotState, pageWindow, readingPercent } from './readerState';

describe('reader and widget rules', () => {
  test('hold is between two and three seconds', () => {
    expect(COMMENT_HOLD_MS).toBeGreaterThanOrEqual(2000);
    expect(COMMENT_HOLD_MS).toBeLessThanOrEqual(3000);
  });
  test('widget progress is clamped to one through one hundred', () => {
    expect(readingPercent(0, 200)).toBe(1);
    expect(readingPercent(100, 200)).toBe(50);
    expect(readingPercent(200, 200)).toBe(100);
    expect(readingPercent(300, 200)).toBe(100);
  });
  test('mascot becomes angry at twenty four hours without reading', () => {
    const last = 1000000;
    expect(mascotState(last, false, 12, last + 86400000 - 1)).toBe('idle');
    expect(mascotState(last, false, 12, last + 86400000)).toBe('angry');
  });
  test('finished book celebrates', () => {
    expect(mascotState(100, true, 12, 200)).toBe('celebrating');
  });
  test('adjacent rendering stays bounded for thousand page books', () => {
    expect([...pageWindow(500, 1000)]).toEqual([497, 498, 499, 500, 501, 502, 503]);
    expect([...pageWindow(1, 2)]).toEqual([1, 2]);
  });
});