import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSavedConfig, updateSupabaseConfig } from '../../../src/lib/supabase';

describe('Supabase Lib', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty config when localStorage is empty', () => {
    const config = getSavedConfig();
    expect(config.url).toBe('');
    expect(config.key).toBe('');
    expect(config.isValid).toBe(false);
  });

  it('should sanitize URL and save to localStorage', () => {
    const rawUrl = ' https://xyz.supabase.co/rest/v1/ ';
    const rawKey = ' secret-key ';
    
    updateSupabaseConfig(rawUrl, rawKey);
    
    expect(localStorage.getItem('STREETEASY_SUPABASE_URL')).toBe('https://xyz.supabase.co');
    expect(localStorage.getItem('STREETEASY_SUPABASE_KEY')).toBe('secret-key');
    
    const config = getSavedConfig();
    expect(config.url).toBe('https://xyz.supabase.co');
    expect(config.key).toBe('secret-key');
    expect(config.isValid).toBe(true);
  });

  it('should handle invalid URLs gracefully', () => {
    const rawUrl = 'not-a-url';
    updateSupabaseConfig(rawUrl, 'key');
    const config = getSavedConfig();
    expect(config.url).toBe('not-a-url');
  });
});
