import { RESOURCES, computeLongestRoad } from './catan';
import type { PlayerState, BoardOccupancy } from './catan';

export const TARGET_SCORE = 8;
export const MAX_TURNS = 500;

export function buildOccupancy(stateMap: Map<number, PlayerState>): BoardOccupancy {
  return {
    settlements: [...stateMap.values()].flatMap(p => p.settlementNodes),
    cities:      [...stateMap.values()].flatMap(p => p.cityNodes),
    roads:       [...stateMap.values()].flatMap(p => p.roadEdges),
  };
}

export function stealRandom(victim: PlayerState, thief: PlayerState): void {
  const available = RESOURCES.filter(r => victim[r] > 0);
  if (available.length === 0) return;
  const res = available[Math.floor(Math.random() * available.length)];
  victim[res] -= 1;
  thief[res] += 1;
}

// Largest army: first to 3+ knights played takes it; only changes hands if a
// challenger strictly exceeds the current holder's knight count.
export function updateLargestArmy(stateMap: Map<number, PlayerState>): void {
  let currentHolderId: number | null = null;
  let currentHolderKnights = 0;
  for (const [id, s] of stateMap) {
    if (s.hasLargestArmy) { currentHolderId = id; currentHolderKnights = s.knightsPlayed; }
  }
  if (currentHolderId === null) {
    let bestId: number | null = null;
    let bestKnights = 2;
    for (const [id, s] of stateMap) {
      if (s.knightsPlayed > bestKnights) { bestKnights = s.knightsPlayed; bestId = id; }
    }
    if (bestId !== null) stateMap.get(bestId)!.hasLargestArmy = true;
  } else {
    for (const [id, s] of stateMap) {
      if (id !== currentHolderId && s.knightsPlayed > currentHolderKnights) {
        stateMap.get(currentHolderId)!.hasLargestArmy = false;
        s.hasLargestArmy = true;
        currentHolderKnights = s.knightsPlayed;
        currentHolderId = id;
      }
    }
  }
}

// Longest road: first to 5+ road length takes it; only changes hands if a
// challenger strictly exceeds the current holder's road length.
export function updateLongestRoad(stateMap: Map<number, PlayerState>): void {
  function roadLen(id: number, s: PlayerState): number {
    const myOcc = new Set([...s.settlementNodes, ...s.cityNodes]);
    const oppOcc = new Set<number>();
    for (const [oid, os] of stateMap) {
      if (oid !== id) {
        for (const n of os.settlementNodes) oppOcc.add(n);
        for (const n of os.cityNodes) oppOcc.add(n);
      }
    }
    return computeLongestRoad(s.roadEdges, myOcc, oppOcc);
  }

  let currentHolderId: number | null = null;
  let currentHolderLen = 0;
  for (const [id, s] of stateMap) {
    if (s.hasLongestRoad) { currentHolderId = id; currentHolderLen = roadLen(id, s); break; }
  }

  if (currentHolderId === null) {
    let bestId: number | null = null;
    let bestLen = 4;
    for (const [id, s] of stateMap) {
      const len = roadLen(id, s);
      if (len > bestLen) { bestLen = len; bestId = id; }
    }
    if (bestId !== null) stateMap.get(bestId)!.hasLongestRoad = true;
  } else {
    for (const [id, s] of stateMap) {
      if (id === currentHolderId) continue;
      const len = roadLen(id, s);
      if (len > currentHolderLen) {
        stateMap.get(currentHolderId)!.hasLongestRoad = false;
        s.hasLongestRoad = true;
        currentHolderLen = len;
        currentHolderId = id;
      }
    }
  }
}
