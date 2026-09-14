import { describe, it, expect } from 'vitest';

const ACTIVE_STATES = new Set([
  'QUEUED',
  'PLANNING',
  'AWAITING_PLAN_APPROVAL',
  'AWAITING_USER_FEEDBACK',
  'IN_PROGRESS',
]);

describe('Jules orchestrator preflight state semantics', () => {
  it('treats documented Jules work states as active', () => {
    for (const state of ACTIVE_STATES) {
      expect(ACTIVE_STATES.has(state)).toBe(true);
    }
  });

  it('does not treat terminal states as active', () => {
    for (const state of ['PAUSED', 'COMPLETED', 'FAILED']) {
      expect(ACTIVE_STATES.has(state)).toBe(false);
    }
  });

  it('fails closed for unknown states', () => {
    expect(ACTIVE_STATES.has('STATE_UNSPECIFIED')).toBe(false);
    expect(ACTIVE_STATES.has('UNKNOWN')).toBe(false);
  });
});
