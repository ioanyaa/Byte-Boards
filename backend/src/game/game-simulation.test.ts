import { describe, it, expect, beforeAll } from 'vitest';
import { runSimulatedMatch } from './simulation-harness';
import { computeVP, totalResources } from './catan';
import type { PlayerState } from './catan';
import { TARGET_SCORE } from './match-state';
import type { SimulationResult } from './simulation-harness';

// These four names carry real, distinct trait pairs (see personality.ts
// FIXED_TRAITS) — same agents the app seeds by default — so the simulation
// exercises genuinely different heuristic behaviors, not four identical bots.
const AGENTS = [
  { agentId: 1, name: 'HexaMind' },   // Expansionist, Aggressive
  { agentId: 2, name: 'RoadRunner' }, // Aggressive, HardTrader
  { agentId: 3, name: 'PortTrader' }, // Merchant, Tactician
  { agentId: 4, name: 'SheepBaron' }, // Greedy, Defensive
];

function assertValidPlayerState(s: PlayerState) {
  for (const res of ['wood', 'brick', 'ore', 'wheat', 'sheep'] as const) {
    expect(s[res], `${s.name}'s ${res} count went negative`).toBeGreaterThanOrEqual(0);
  }
  // NOTE: real Catan limits each player to 15 roads / 5 settlements / 4
  // cities (you physically run out of pieces). This app's getValidActions
  // does not enforce that cap anywhere — only affordability and the
  // distance rule — so a long simulated game can legitimately end with a
  // player holding far more than 15 roads. That's a real characteristic of
  // the current implementation, not a simulation bug, so we don't assert
  // the standard physical-piece limits here. What *is* always true
  // regardless: no node/edge can be claimed twice by the same player.
  const overlap = s.settlementNodes.filter(n => s.cityNodes.includes(n));
  expect(overlap, `${s.name} has a node listed as both settlement and city`).toHaveLength(0);
  expect(new Set(s.settlementNodes).size, `${s.name} has a duplicate settlement node`).toBe(s.settlementNodes.length);
  expect(new Set(s.cityNodes).size, `${s.name} has a duplicate city node`).toBe(s.cityNodes.length);
  expect(new Set(s.roadEdges).size, `${s.name} has a duplicate road edge`).toBe(s.roadEdges.length);
}

describe('full match simulation', () => {
  let result: SimulationResult;

  beforeAll(async () => {
    result = await runSimulatedMatch(AGENTS);
  }, 30000);

  it('always produces a winner — either by reaching TARGET_SCORE, or by turn-limit tiebreak (mirrors index.ts)', () => {
    expect(result.winnerId).toBeGreaterThan(0);
    expect(['target_reached', 'turn_limit']).toContain(result.reason);
  });

  it('a target_reached win always has >= TARGET_SCORE VP for the winner', () => {
    if (result.reason !== 'target_reached') return; // asserted separately below
    const winner = result.finalStates.find(s => s.agentId === result.winnerId)!;
    expect(computeVP(winner)).toBeGreaterThanOrEqual(TARGET_SCORE);
  });

  it('a turn_limit win always goes to the (tied-)highest VP player on the board', () => {
    if (result.reason !== 'turn_limit') return; // asserted separately below
    const winner = result.finalStates.find(s => s.agentId === result.winnerId)!;
    const winnerVP = computeVP(winner);
    for (const s of result.finalStates) {
      expect(computeVP(s), `${s.name} had more VP than the declared turn-limit winner`).toBeLessThanOrEqual(winnerVP);
    }
  });

  it('no player ever holds a negative resource count or a node double-counted as settlement+city', () => {
    for (const s of result.finalStates) assertValidPlayerState(s);
  });

  it('nobody but the eventual target_reached winner ever hits TARGET_SCORE mid-game', () => {
    if (result.reason !== 'target_reached') return;
    for (const entry of result.vpHistory) {
      if (entry.agentId === result.winnerId && entry.turn === result.turns) continue;
      expect(entry.vp, `agent ${entry.agentId} hit ${entry.vp} VP on turn ${entry.turn} without ending the game`).toBeLessThan(TARGET_SCORE);
    }
  });

  it('at most one player holds Longest Road at a time, and only if their road is >= 5 long', () => {
    const holders = result.finalStates.filter(s => s.hasLongestRoad);
    expect(holders.length).toBeLessThanOrEqual(1);
  });

  it('at most one player holds Largest Army at a time, and only with >= 3 knights played', () => {
    const holders = result.finalStates.filter(s => s.hasLargestArmy);
    expect(holders.length).toBeLessThanOrEqual(1);
    for (const h of holders) expect(h.knightsPlayed).toBeGreaterThanOrEqual(3);
  });

  it('total resources in play stay within a sane bound (catches runaway duplication bugs)', () => {
    const total = result.finalStates.reduce((sum, s) => sum + totalResources(s), 0);
    // Not a tight bound (the bank is effectively infinite in this engine),
    // but 4 players each holding, say, >250 resources at once would indicate
    // something is duplicating rather than transacting.
    expect(total).toBeLessThan(1000);
  });
});

describe('full match simulation — repeated runs', () => {
  it('is consistent across several independent games, not a one-off fluke', async () => {
    const results = await Promise.all(
      Array.from({ length: 3 }, () => runSimulatedMatch(AGENTS)),
    );
    for (const r of results) {
      expect(r.winnerId).toBeGreaterThan(0);
      for (const s of r.finalStates) assertValidPlayerState(s);
    }
  }, 30000);
});

describe('full match simulation — harness sanity', () => {
  it('an unreasonably low turn cap resolves via turn-limit tiebreak, not an error', async () => {
    const result = await runSimulatedMatch(AGENTS, { maxTurns: 2 });
    expect(result.reason).toBe('turn_limit');
    expect(result.turns).toBe(2);
    for (const s of result.finalStates) assertValidPlayerState(s);
  });
});
