import { beforeEach, describe, expect, it } from 'vitest';
import { getStorageKey } from '../src/config';
import { loadShareStyle, saveShareStyle } from '../src/dashboard-app/share-style';

const KEY = getStorageKey('share-style');

beforeEach(() => localStorage.clear());

describe('remembered share style', () => {
  it('starts on Vận đơn, square, and returns what was saved', () => {
    expect(loadShareStyle()).toEqual({ template: 'sale', ratio: 'square' });
    saveShareStyle({ template: 'cat', ratio: 'story' });
    expect(loadShareStyle()).toEqual({ template: 'cat', ratio: 'story' });
  });

  it.each([
    ['not JSON', '{oops'],
    ['unknown values', JSON.stringify({ template: 'shopee-logo', ratio: 'toString' })],
    ['wrong types', JSON.stringify({ template: 3, ratio: null })],
  ])('falls back to the default for %s', (_, raw) => {
    localStorage.setItem(KEY, raw);
    expect(loadShareStyle()).toEqual({ template: 'sale', ratio: 'square' });
  });
});
