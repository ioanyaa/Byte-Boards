import { EMPTY_DEV_CARDS } from './catan';
import type { PlayerState, BoardOccupancy, DevCardCounts } from './catan';

export function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    agentId: 1,
    name: 'Test',
    wood: 0, brick: 0, ore: 0, wheat: 0, sheep: 0,
    settlementNodes: [], cityNodes: [], roadEdges: [], shipEdges: [],
    devCards: { ...EMPTY_DEV_CARDS } as DevCardCounts,
    knightsPlayed: 0, hasLargestArmy: false, hasLongestRoad: false, islandVPs: 0,
    ...overrides,
  };
}

export const EMPTY_OCCUPANCY: BoardOccupancy = { settlements: [], cities: [], roads: [] };

/** Builds a BoardOccupancy from a list of players. */
export function occupancyOf(players: PlayerState[]): BoardOccupancy {
  return {
    settlements: players.flatMap(p => p.settlementNodes),
    cities: players.flatMap(p => p.cityNodes),
    roads: players.flatMap(p => p.roadEdges),
  };
}
