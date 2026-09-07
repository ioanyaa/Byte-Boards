import { describe, it, expect } from 'vitest';
import {
  pickGoldResource, collectSeafarersResources, isValidShipPlacement,
  getSeafarersExtraActions, checkExplorationVP,
} from './seafarers';
import { SEA_TRANSIT_EDGES, OUTER_TILES, GOLD_TILE_INDICES, NODE_ISLAND, OUTER_ISLAND_EDGES } from './seafarers-graph';
import { RESOURCES } from './catan';
import { makePlayer, EMPTY_OCCUPANCY } from './test-helpers';

// One real main->outer transit edge, verified to have a coastal main endpoint.
const [MAIN_NODE, OUTER_NODE] = (() => {
  const edge = SEA_TRANSIT_EDGES.find(e => {
    const a = parseInt(e.slice(0, 2), 10), b = parseInt(e.slice(2, 4), 10);
    return (a < 54) !== (b < 54); // exactly one side is a main-island node
  })!;
  const a = parseInt(edge.slice(0, 2), 10), b = parseInt(edge.slice(2, 4), 10);
  return a < 54 ? [a, b] : [b, a];
})();
const TRANSIT_EDGE = `${String(Math.min(MAIN_NODE, OUTER_NODE)).padStart(2, '0')}${String(Math.max(MAIN_NODE, OUTER_NODE)).padStart(2, '0')}`;

describe('pickGoldResource', () => {
  it('picks the resource the player has the least of', () => {
    const player = makePlayer({ wood: 5, brick: 0, ore: 3, wheat: 2, sheep: 1 });
    expect(pickGoldResource(player)).toBe('brick');
  });

  it('is deterministic (first resource in RESOURCES order) on a tie', () => {
    const player = makePlayer({ wood: 0, brick: 0, ore: 0, wheat: 0, sheep: 0 });
    expect(pickGoldResource(player)).toBe(RESOURCES[0]);
  });
});

describe('collectSeafarersResources', () => {
  it('grants normal resources from a matching non-gold tile', () => {
    const tile = OUTER_TILES.find(t => !GOLD_TILE_INDICES.has(t.index))!;
    const player = makePlayer({ settlementNodes: [tile.nodes[0]] });
    const { gained, goldCount } = collectSeafarersResources(player, tile.number, OUTER_TILES, -1, null);
    expect(gained[tile.resource as keyof typeof gained]).toBe(1);
    expect(goldCount).toBe(0);
  });

  it('grants gold tokens (not a fixed resource) from the gold tile', () => {
    const goldTile = OUTER_TILES.find(t => GOLD_TILE_INDICES.has(t.index))!;
    const player = makePlayer({ settlementNodes: [goldTile.nodes[0]] });
    const { gained, goldCount } = collectSeafarersResources(player, goldTile.number, OUTER_TILES, -1, null);
    expect(goldCount).toBe(1);
    expect(Object.keys(gained)).toHaveLength(0);
  });

  it('a city on the gold tile grants 2 gold tokens', () => {
    const goldTile = OUTER_TILES.find(t => GOLD_TILE_INDICES.has(t.index))!;
    const player = makePlayer({ cityNodes: [goldTile.nodes[0]] });
    const { goldCount } = collectSeafarersResources(player, goldTile.number, OUTER_TILES, -1, null);
    expect(goldCount).toBe(2);
  });

  it('the pirate blocks production on its tile, same as the robber', () => {
    const tile = OUTER_TILES.find(t => !GOLD_TILE_INDICES.has(t.index))!;
    const player = makePlayer({ settlementNodes: [tile.nodes[0]] });
    const { gained, goldCount } = collectSeafarersResources(player, tile.number, OUTER_TILES, -1, tile.index);
    expect(Object.keys(gained)).toHaveLength(0);
    expect(goldCount).toBe(0);
  });
});

describe('isValidShipPlacement', () => {
  it('allows a first ship from an owned coastal settlement onto a real transit edge', () => {
    const player = makePlayer({ settlementNodes: [MAIN_NODE] });
    expect(isValidShipPlacement(TRANSIT_EDGE, [], [], player.settlementNodes, [], [])).toBe(true);
  });

  it('rejects an edge that is not a sea edge at all', () => {
    expect(isValidShipPlacement('0102', [], [], [0, 2], [], [])).toBe(false);
  });

  it('rejects an edge already claimed by any player\'s ship', () => {
    const player = makePlayer({ settlementNodes: [MAIN_NODE] });
    expect(isValidShipPlacement(TRANSIT_EDGE, [TRANSIT_EDGE], [], player.settlementNodes, [], [])).toBe(false);
  });

  it('rejects a sea edge with no connection to the player\'s network at all', () => {
    // Player owns nothing, has no ships, no roads — no anchor exists.
    expect(isValidShipPlacement(TRANSIT_EDGE, [], [], [], [], [])).toBe(false);
  });

  it('allows extending from the endpoint of one of the player\'s own existing ships', () => {
    // Ship already placed on TRANSIT_EDGE; the outer endpoint should now anchor further ships.
    // (We just confirm the anchor logic recognizes the ship endpoint — using the same edge
    // as "already placed" would fail the duplicate check, so this asserts via shipEndpoints directly.)
    const player = makePlayer({ shipEdges: [TRANSIT_EDGE] });
    // Any other real sea edge sharing the outer endpoint should now be a valid anchor point.
    const fromOuterNode = OUTER_ISLAND_EDGES.find((e) => {
      const a = parseInt(e.slice(0, 2), 10), b = parseInt(e.slice(2, 4), 10);
      return a === OUTER_NODE || b === OUTER_NODE;
    });
    if (fromOuterNode) {
      expect(isValidShipPlacement(fromOuterNode, [TRANSIT_EDGE], player.shipEdges, [], [], [])).toBe(true);
    }
  });
});

describe('getSeafarersExtraActions', () => {
  it('offers build_ship options once the player can afford wood+sheep', () => {
    const player = makePlayer({ wood: 1, sheep: 1, settlementNodes: [MAIN_NODE] });
    const actions = getSeafarersExtraActions(player, [player], EMPTY_OCCUPANCY);
    expect(actions.some(a => a.startsWith('build_ship:'))).toBe(true);
  });

  it('offers no build_ship options without wood+sheep', () => {
    const player = makePlayer({ settlementNodes: [MAIN_NODE] });
    const actions = getSeafarersExtraActions(player, [player], EMPTY_OCCUPANCY);
    expect(actions.some(a => a.startsWith('build_ship:'))).toBe(false);
  });

  it('offers an outer-island settlement once a ship reaches it and it is unoccupied', () => {
    const player = makePlayer({
      wood: 1, brick: 1, wheat: 1, sheep: 1,
      settlementNodes: [MAIN_NODE], shipEdges: [TRANSIT_EDGE],
    });
    const actions = getSeafarersExtraActions(player, [player], EMPTY_OCCUPANCY);
    expect(actions).toContain(`build_settlement:${String(OUTER_NODE).padStart(2, '0')}`);
  });

  it('does not offer an outer-island node that is already occupied', () => {
    const player = makePlayer({
      wood: 1, brick: 1, wheat: 1, sheep: 1,
      settlementNodes: [MAIN_NODE], shipEdges: [TRANSIT_EDGE],
    });
    const occupancy = { settlements: [OUTER_NODE], cities: [], roads: [] };
    const actions = getSeafarersExtraActions(player, [player], occupancy);
    expect(actions).not.toContain(`build_settlement:${String(OUTER_NODE).padStart(2, '0')}`);
  });
});

describe('checkExplorationVP', () => {
  it('grants the island id the first time a player settles that island', () => {
    const someOuterNode = Object.keys(NODE_ISLAND).map(Number)[0];
    expect(checkExplorationVP(someOuterNode, [])).toBe(NODE_ISLAND[someOuterNode]);
  });

  it('grants nothing for a second settlement on an island already settled', () => {
    const nodesOnIsland1 = Object.entries(NODE_ISLAND).filter(([, isl]) => isl === 1).map(([n]) => Number(n));
    const [first, second] = nodesOnIsland1;
    expect(checkExplorationVP(second, [first])).toBe(0);
  });

  it('grants nothing for a main-island node (not part of any outer island)', () => {
    expect(checkExplorationVP(0, [])).toBe(0);
  });
});
