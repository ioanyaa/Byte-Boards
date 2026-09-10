import { describe, it, expect } from 'vitest';
import {
  getValidActions, applyAction, computeVP, computeLongestRoad,
  collectResources, handleRobber, canAfford, totalResources,
  createInitialPlacement, getValidRoadEdges, BUILD_COSTS, RESOURCES,
} from './catan';
import { BOARD_TILES, BOARD_NODES, edgeId } from './graph';
import { makePlayer, EMPTY_OCCUPANCY, occupancyOf } from './test-helpers';

describe('canAfford', () => {
  it('true when player has at least the required amount of every listed resource', () => {
    expect(canAfford(makePlayer({ wood: 1, brick: 1 }), BUILD_COSTS.road)).toBe(true);
  });

  it('false when any single resource is short', () => {
    expect(canAfford(makePlayer({ wood: 1, brick: 0 }), BUILD_COSTS.road)).toBe(false);
  });

  it('true with exactly the required amount (not just surplus)', () => {
    expect(canAfford(makePlayer({ wheat: 2, ore: 3 }), BUILD_COSTS.city)).toBe(true);
  });
});

describe('getValidActions', () => {
  it('always includes pass', () => {
    expect(getValidActions(makePlayer(), [], EMPTY_OCCUPANCY)).toContain('pass');
  });

  it('offers no build_road when the player cannot afford one', () => {
    const actions = getValidActions(makePlayer(), [], EMPTY_OCCUPANCY);
    expect(actions.some(a => a.startsWith('build_road'))).toBe(false);
  });

  it('offers build_road extending from an existing settlement, once affordable', () => {
    const player = makePlayer({ wood: 1, brick: 1, settlementNodes: [10] });
    const actions = getValidActions(player, [], EMPTY_OCCUPANCY);
    const expectedEdges = BOARD_NODES[10].adjacentNodes.map(n => edgeId(10, n));
    const roadActions = actions.filter(a => a.startsWith('build_road:'));
    expect(roadActions.length).toBeGreaterThan(0);
    for (const a of roadActions) expect(expectedEdges).toContain(a.slice('build_road:'.length));
  });

  it('never offers build_settlement without an existing road, even if affordable', () => {
    const player = makePlayer({ wood: 1, brick: 1, wheat: 1, sheep: 1 });
    const actions = getValidActions(player, [], EMPTY_OCCUPANCY);
    expect(actions.some(a => a.startsWith('build_settlement'))).toBe(false);
  });

  it('offers build_settlement at a legal road endpoint once affordable', () => {
    const node = 10;
    const neighbour = BOARD_NODES[node].adjacentNodes[0];
    const player = makePlayer({
      wood: 1, brick: 1, wheat: 1, sheep: 1,
      settlementNodes: [node], roadEdges: [edgeId(node, neighbour)],
    });
    const actions = getValidActions(player, [], EMPTY_OCCUPANCY);
    expect(actions).toContain(`build_settlement:${String(neighbour).padStart(2, '0')}`);
  });

  it('does not offer build_settlement at a road endpoint that fails the distance rule', () => {
    // occupancy already has a settlement adjacent to the road endpoint
    const node = 10;
    const neighbour = BOARD_NODES[node].adjacentNodes[0];
    const neighbourOfNeighbour = BOARD_NODES[neighbour].adjacentNodes.find(n => n !== node)!;
    const player = makePlayer({
      wood: 1, brick: 1, wheat: 1, sheep: 1,
      settlementNodes: [node], roadEdges: [edgeId(node, neighbour)],
    });
    const occupancy = { settlements: [neighbourOfNeighbour], cities: [], roads: [] };
    const actions = getValidActions(player, [], occupancy);
    expect(actions).not.toContain(`build_settlement:${String(neighbour).padStart(2, '0')}`);
  });

  it('offers build_city for any owned settlement once affordable (no geometry check)', () => {
    const player = makePlayer({ wheat: 2, ore: 3, settlementNodes: [5] });
    expect(getValidActions(player, [], EMPTY_OCCUPANCY)).toContain('build_city:05');
  });

  it('offers buy_dev_card once affordable', () => {
    const player = makePlayer({ ore: 1, wheat: 1, sheep: 1 });
    expect(getValidActions(player, [], EMPTY_OCCUPANCY)).toContain('buy_dev_card');
  });

  it('offers a 4:1 bank trade once a resource reaches 4, for every other resource', () => {
    const player = makePlayer({ wood: 4 });
    const actions = getValidActions(player, [], EMPTY_OCCUPANCY);
    for (const receive of RESOURCES.filter(r => r !== 'wood')) {
      expect(actions).toContain(`trade_bank:wood:${receive}`);
    }
  });

  it('does not offer a bank trade below 4 of a resource', () => {
    const player = makePlayer({ wood: 3 });
    expect(getValidActions(player, [], EMPTY_OCCUPANCY).some(a => a.startsWith('trade_bank:wood:'))).toBe(false);
  });

  it('offers play_year_of_plenty (one per resource) only when holding the card', () => {
    const withCard = makePlayer({ devCards: { ...makePlayer().devCards, year_of_plenty: 1 } });
    const without = makePlayer();
    const withActions = getValidActions(withCard, [], EMPTY_OCCUPANCY);
    for (const r of RESOURCES) expect(withActions).toContain(`play_year_of_plenty:${r}`);
    expect(getValidActions(without, [], EMPTY_OCCUPANCY).some(a => a.startsWith('play_year_of_plenty'))).toBe(false);
  });
});

describe('applyAction', () => {
  it('build_road deducts 1 wood + 1 brick and records the edge', () => {
    const player = makePlayer({ wood: 1, brick: 1 });
    const { text, vpDelta } = applyAction(player, 'build_road:0102');
    expect(player.wood).toBe(0);
    expect(player.brick).toBe(0);
    expect(player.roadEdges).toContain('0102');
    expect(vpDelta).toBe(0);
    expect(text).toMatch(/road/);
  });

  it('build_settlement deducts a full settlement cost and grants 1 VP', () => {
    const player = makePlayer({ wood: 1, brick: 1, wheat: 1, sheep: 1, roadEdges: ['0506'] });
    const { vpDelta } = applyAction(player, 'build_settlement:05');
    expect(player.wood).toBe(0);
    expect(player.brick).toBe(0);
    expect(player.wheat).toBe(0);
    expect(player.sheep).toBe(0);
    expect(player.settlementNodes).toContain(5);
    expect(vpDelta).toBe(1);
  });

  it('build_city moves the node from settlements to cities, deducts cost, grants 1 VP', () => {
    const player = makePlayer({ wheat: 2, ore: 3, settlementNodes: [5] });
    const { vpDelta } = applyAction(player, 'build_city:05');
    expect(player.settlementNodes).not.toContain(5);
    expect(player.cityNodes).toContain(5);
    expect(player.wheat).toBe(0);
    expect(player.ore).toBe(0);
    expect(vpDelta).toBe(1);
  });

  it('buy_dev_card deducts ore+wheat+sheep and grants no immediate VP', () => {
    const player = makePlayer({ ore: 1, wheat: 1, sheep: 1 });
    const { vpDelta } = applyAction(player, 'buy_dev_card');
    expect(player.ore).toBe(0);
    expect(player.wheat).toBe(0);
    expect(player.sheep).toBe(0);
    expect(vpDelta).toBe(0);
  });

  it('play_year_of_plenty consumes the card and grants 2 of the chosen resource', () => {
    const player = makePlayer({ devCards: { ...makePlayer().devCards, year_of_plenty: 1 } });
    applyAction(player, 'play_year_of_plenty:ore');
    expect(player.devCards.year_of_plenty).toBe(0);
    expect(player.ore).toBe(2);
  });

  it('trade_bank swaps exactly 4 of one resource for 1 of another', () => {
    const player = makePlayer({ wood: 4 });
    applyAction(player, 'trade_bank:wood:ore');
    expect(player.wood).toBe(0);
    expect(player.ore).toBe(1);
  });

  it('trade_bank only spends 4 even if the player holds more', () => {
    const player = makePlayer({ wood: 9 });
    applyAction(player, 'trade_bank:wood:ore');
    expect(player.wood).toBe(5);
    expect(player.ore).toBe(1);
  });

  it('pass and unrecognized actions are no-ops with vpDelta 0', () => {
    const player = makePlayer({ wood: 3 });
    const { vpDelta, text } = applyAction(player, 'pass');
    expect(vpDelta).toBe(0);
    expect(text).toMatch(/passes/);
    expect(player.wood).toBe(3);
  });
});

describe('computeVP', () => {
  it('1 VP per settlement', () => {
    expect(computeVP(makePlayer({ settlementNodes: [1, 2] }))).toBe(2);
  });

  it('2 VP per city', () => {
    expect(computeVP(makePlayer({ cityNodes: [1] }))).toBe(2);
  });

  it('VP dev cards count directly', () => {
    expect(computeVP(makePlayer({ devCards: { ...makePlayer().devCards, vp: 3 } }))).toBe(3);
  });

  it('+2 for largest army, +2 for longest road', () => {
    expect(computeVP(makePlayer({ hasLargestArmy: true, hasLongestRoad: true }))).toBe(4);
  });

  it('+1 per island VP (Seafarers exploration bonus)', () => {
    expect(computeVP(makePlayer({ islandVPs: 2 }))).toBe(2);
  });

  it('sums every source together', () => {
    const player = makePlayer({
      settlementNodes: [1, 2], cityNodes: [3],
      hasLargestArmy: true, hasLongestRoad: true,
      devCards: { ...makePlayer().devCards, vp: 1 },
      islandVPs: 1,
    });
    // 2 settlements + 1 city(2) + army(2) + road(2) + vpCard(1) + island(1) = 10
    expect(computeVP(player)).toBe(10);
  });
});

describe('computeLongestRoad', () => {
  it('0 for no roads', () => {
    expect(computeLongestRoad([], new Set(), new Set())).toBe(0);
  });

  it('counts a simple chain correctly', () => {
    // 0 - 4 - 8: two edges = length 2
    const edges = [edgeId(0, 4), edgeId(4, 8)];
    expect(computeLongestRoad(edges, new Set(), new Set())).toBe(2);
  });

  it('picks the longer branch at a fork', () => {
    // Fork at node 4: 0-4-8 (len 2) vs 0-4-8-12 (len 3)
    const edges = [edgeId(0, 4), edgeId(4, 8), edgeId(8, 12)];
    expect(computeLongestRoad(edges, new Set(), new Set())).toBe(3);
  });

  it('an opponent settlement at an intermediate node breaks the chain', () => {
    const edges = [edgeId(0, 4), edgeId(4, 8)];
    // Opponent owns node 4, which sits in the middle of the chain.
    expect(computeLongestRoad(edges, new Set(), new Set([4]))).toBe(1);
  });

  it('the player\'s own settlement at an intermediate node does NOT break the chain', () => {
    const edges = [edgeId(0, 4), edgeId(4, 8)];
    expect(computeLongestRoad(edges, new Set([4]), new Set())).toBe(2);
  });
});

describe('collectResources', () => {
  it('grants 1 resource per settlement on a matching, non-robbed tile', () => {
    const tile = BOARD_TILES.find(t => t.resource !== 'desert')!;
    const player = makePlayer({ settlementNodes: [tile.nodes[0]] });
    const gained = collectResources(player, tile.number, BOARD_TILES, /* robberTile */ -1);
    expect(gained[tile.resource as keyof typeof gained]).toBe(1);
  });

  it('grants 2 resources per city on a matching tile', () => {
    const tile = BOARD_TILES.find(t => t.resource !== 'desert')!;
    const player = makePlayer({ cityNodes: [tile.nodes[0]] });
    const gained = collectResources(player, tile.number, BOARD_TILES, -1);
    expect(gained[tile.resource as keyof typeof gained]).toBe(2);
  });

  it('grants nothing when the robber sits on the producing tile', () => {
    const tile = BOARD_TILES.find(t => t.resource !== 'desert')!;
    const player = makePlayer({ settlementNodes: [tile.nodes[0]] });
    const gained = collectResources(player, tile.number, BOARD_TILES, tile.index);
    expect(gained[tile.resource as keyof typeof gained] ?? 0).toBe(0);
  });

  it('grants nothing for a non-matching dice roll', () => {
    const tile = BOARD_TILES.find(t => t.resource !== 'desert')!;
    const player = makePlayer({ settlementNodes: [tile.nodes[0]] });
    const otherRoll = tile.number === 6 ? 8 : 6;
    const gained = collectResources(player, otherRoll, BOARD_TILES, -1);
    expect(gained[tile.resource as keyof typeof gained] ?? 0).toBe(0);
  });

  it('a settlement touching two different tiles that share a number gets resources from both', () => {
    // Use synthetic tiles rather than searching the real board for a
    // same-number coincidence — collectResources takes boardTiles as a
    // parameter specifically so this doesn't need real board geometry.
    const sharedNode = 5;
    const tiles = [
      { index: 100, resource: 'wood' as const, number: 8, nodes: [sharedNode, 1, 2, 3, 4, 6] as [number, number, number, number, number, number] },
      { index: 101, resource: 'ore' as const, number: 8, nodes: [sharedNode, 7, 8, 9, 10, 11] as [number, number, number, number, number, number] },
    ];
    const player = makePlayer({ settlementNodes: [sharedNode] });
    const gained = collectResources(player, 8, tiles, -1);
    expect(gained.wood).toBe(1);
    expect(gained.ore).toBe(1);
  });
});

describe('handleRobber (discard on 7)', () => {
  it('players with fewer than 7 resources keep everything', () => {
    const p = makePlayer({ wood: 3, brick: 3 });
    handleRobber([p]);
    expect(totalResources(p)).toBe(6);
  });

  it('players with 7+ resources discard exactly half, rounded down', () => {
    const p = makePlayer({ wood: 4, brick: 3 }); // 7 total -> discard 3
    handleRobber([p]);
    expect(totalResources(p)).toBe(4);
  });

  it('an 8-resource hand discards 4', () => {
    const p = makePlayer({ wood: 4, brick: 4 }); // 8 total -> discard 4
    handleRobber([p]);
    expect(totalResources(p)).toBe(4);
  });

  it('never drives an individual resource negative', () => {
    const p = makePlayer({ wood: 8 });
    handleRobber([p]);
    expect(p.wood).toBeGreaterThanOrEqual(0);
    expect(totalResources(p)).toBe(4);
  });

  it('returns "no discards" when nobody has 7+', () => {
    expect(handleRobber([makePlayer({ wood: 2 })])).toBe('no discards');
  });
});

describe('createInitialPlacement', () => {
  it('gives exactly 2 settlements and 2 roads', () => {
    const placement = createInitialPlacement([], []);
    expect(placement.settlementNodes).toHaveLength(2);
    expect(placement.roadEdges).toHaveLength(2);
  });

  it('never reuses a node already taken by another player', () => {
    const taken = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const placement = createInitialPlacement(taken, []);
    for (const n of placement.settlementNodes) expect(taken).not.toContain(n);
  });

  it('respects the distance rule against its own two settlements', () => {
    const placement = createInitialPlacement([], []);
    const [a, b] = placement.settlementNodes;
    expect(BOARD_NODES[a].adjacentNodes).not.toContain(b);
  });

  it('each placed road touches its corresponding settlement', () => {
    const placement = createInitialPlacement([], []);
    const nodeSet = new Set(placement.settlementNodes);
    for (const road of placement.roadEdges) {
      const a = parseInt(road.slice(0, 2), 10);
      const b = parseInt(road.slice(2, 4), 10);
      expect(nodeSet.has(a) || nodeSet.has(b)).toBe(true);
    }
  });
});

describe('getValidRoadEdges', () => {
  it('matches the build_road options returned by getValidActions', () => {
    const player = makePlayer({ wood: 1, brick: 1, settlementNodes: [10] });
    const fromActions = getValidActions(player, [], EMPTY_OCCUPANCY)
      .filter(a => a.startsWith('build_road:'))
      .map(a => a.slice('build_road:'.length))
      .sort();
    const direct = getValidRoadEdges(player, EMPTY_OCCUPANCY).sort();
    expect(direct).toEqual(fromActions);
  });
});

describe('occupancyOf test helper sanity check', () => {
  it('aggregates settlements/cities/roads across players', () => {
    const p1 = makePlayer({ agentId: 1, settlementNodes: [1], roadEdges: ['0102'] });
    const p2 = makePlayer({ agentId: 2, cityNodes: [5] });
    const occ = occupancyOf([p1, p2]);
    expect(occ.settlements).toEqual([1]);
    expect(occ.cities).toEqual([5]);
    expect(occ.roads).toEqual(['0102']);
  });
});
