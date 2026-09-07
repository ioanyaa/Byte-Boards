import { describe, it, expect } from 'vitest';
import {
  ALL_TRAITS, TRAIT_CONFLICTS, TRAIT_DESCRIPTIONS,
  validateTraits, randomTraits, getAgentTraits, buildSystemPrompt,
} from './personality';
import type { Trait } from './personality';

describe('trait data integrity', () => {
  it('every trait has a description', () => {
    for (const t of ALL_TRAITS) expect(TRAIT_DESCRIPTIONS[t]).toBeTruthy();
  });

  it('conflict lists only reference real traits', () => {
    for (const [trait, conflicts] of Object.entries(TRAIT_CONFLICTS)) {
      expect(ALL_TRAITS).toContain(trait as Trait);
      for (const c of conflicts ?? []) expect(ALL_TRAITS).toContain(c);
    }
  });

  it('conflicts are symmetric: if A conflicts with B, B conflicts with A', () => {
    for (const [trait, conflicts] of Object.entries(TRAIT_CONFLICTS)) {
      for (const c of conflicts ?? []) {
        expect(TRAIT_CONFLICTS[c] ?? []).toContain(trait as Trait);
      }
    }
  });

  it('no trait conflicts with itself', () => {
    for (const [trait, conflicts] of Object.entries(TRAIT_CONFLICTS)) {
      expect(conflicts ?? []).not.toContain(trait as Trait);
    }
  });
});

describe('validateTraits', () => {
  it('accepts an empty list', () => {
    expect(validateTraits([])).toBe(true);
  });

  it('accepts two traits with no declared conflict', () => {
    expect(validateTraits(['Merchant', 'Tactician'])).toBe(true);
  });

  it('rejects a known conflicting pair regardless of order', () => {
    expect(validateTraits(['Aggressive', 'Empathic'])).toBe(false);
    expect(validateTraits(['Empathic', 'Aggressive'])).toBe(false);
  });

  it('rejects a conflict buried among several non-conflicting traits', () => {
    expect(validateTraits(['Merchant', 'Aggressive', 'Empathic'])).toBe(false);
  });

  it('accepts a full chain of mutually compatible traits', () => {
    expect(validateTraits(['Merchant', 'Tactician'])).toBe(true);
    // Tactician conflicts with Opportunist, so this trio should fail:
    expect(validateTraits(['Merchant', 'Tactician', 'Opportunist'])).toBe(false);
  });
});

describe('randomTraits', () => {
  it('returns the requested count when satisfiable', () => {
    expect(randomTraits(2)).toHaveLength(2);
  });

  it('never returns an internally conflicting set', () => {
    for (let i = 0; i < 25; i++) {
      const traits = randomTraits(3);
      expect(validateTraits(traits)).toBe(true);
    }
  });

  it('never returns duplicate traits', () => {
    const traits = randomTraits(4);
    expect(new Set(traits).size).toBe(traits.length);
  });
});

describe('getAgentTraits', () => {
  it('returns the fixed trait set for known default agents', () => {
    expect(getAgentTraits('HexaMind')).toEqual(['Expansionist', 'Aggressive']);
    expect(getAgentTraits('SheepBaron')).toEqual(['Greedy', 'Defensive']);
  });

  it('returns 2 valid random traits for an unknown agent name', () => {
    const traits = getAgentTraits('SomeBrandNewAgentName');
    expect(traits).toHaveLength(2);
    expect(validateTraits(traits)).toBe(true);
  });
});

describe('buildSystemPrompt', () => {
  it('includes the agent name', () => {
    expect(buildSystemPrompt('HexaMind', ['Aggressive'])).toContain('HexaMind');
  });

  it('includes the description text for every listed trait', () => {
    const prompt = buildSystemPrompt('Test', ['Aggressive', 'HardTrader']);
    expect(prompt).toContain(TRAIT_DESCRIPTIONS.Aggressive);
    expect(prompt).toContain(TRAIT_DESCRIPTIONS.HardTrader);
  });

  it('still produces a sensible prompt with zero traits', () => {
    const prompt = buildSystemPrompt('Test', []);
    expect(prompt).toContain('Test');
    expect(prompt.length).toBeGreaterThan(10);
  });
});
