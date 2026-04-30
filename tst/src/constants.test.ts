import { describe, it, expect } from 'vitest';
import { UI_CONFIG, DEFAULT_SETTINGS } from '../../src/constants';

describe('Constants', () => {
  it('should have correct UI_CONFIG values', () => {
    expect(UI_CONFIG.LOCATION_TRUNCATION_LIMIT).toBe(5);
    expect(UI_CONFIG.ID_DISPLAY_LENGTH).toBe(8);
  });

  it('should have correct DEFAULT_SETTINGS values', () => {
    expect(DEFAULT_SETTINGS.DELIVERY_METHOD).toBe('email');
  });
});
