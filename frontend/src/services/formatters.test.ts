import { describe, expect, it } from 'vitest';
import {
  formatRouteLabel,
  formatTimestamp,
  getSeverityTone,
} from '@/services/formatters';

describe('formatters', () => {
  it('formats timestamps for the KYC dashboard', () => {
    expect(formatTimestamp('2026-04-21T06:30:00Z')).toMatch(/\d{1,2}:\d{2}/);
  });

  it('returns human-readable route labels and severity tones', () => {
    expect(formatRouteLabel('governance')).toBe('AI Governance Console');
    expect(getSeverityTone('critical')).toContain('var(--danger)');
  });
});
