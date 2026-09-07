import { describe, it, expect } from 'vitest';
import {
  OUTER_TILES, SEA_ALL_TILES, GOLD_TILE_INDICES, NODE_ISLAND, OUTER_NODES,
  SEA_TRANSIT_EDGES, OUTER_ISLAND_EDGES, SEA_EDGES, COASTAL_NODES,
  SEAFARERS_BOARD_NODES, outerNodeNeighbours, OUTER_TILE_INDICES,
} from './seafarers-graph';
import { BOARD_TILES } from './graph';

describe('board composition', () => {
  it('SEA_ALL_TILES is the base board plus the 3 outer island tiles', () => {
    expect(SEA_ALL_TILES).toHaveLength(BOARD_TILES.length + OUTER_TILES.length);
  });

  it('outer tiles use node ids 54-71 exclusively', () => {
    for (const t of OUTER_TILES) {
      for (const n of t.nodes) {
        expect(n).toBeGreaterThanOrEqual(54);
        expect(n).toBeLessThanOrEqual(71);
      }
    }
  });

  it('OUTER_TILE_INDICES matches the outer tiles\' own indices', () => {
    expect(OUTER_TILE_INDICES.sort()).toEqual(OUTER_TILES.map(t => t.index).sort());
  });

  it('exactly one outer tile is the gold field', () => {
    expect(GOLD_TILE_INDICES.size).toBe(1);
    expect([...GOLD_TILE_INDICES].every(i => OUTER_TILES.some(t => t.index === i))).toBe(true);
  });
});

describe('NODE_ISLAND / OUTER_NODES', () => {
  it('every outer node is assigned to exactly one island (1, 2, or 3)', () => {
    for (const n of OUTER_NODES) {
      expect([1, 2, 3]).toContain(NODE_ISLAND[n]);
    }
  });

  it('OUTER_NODES has exactly 18 nodes (3 islands x 6)', () => {
    expect(OUTER_NODES.size).toBe(18);
  });

  it('main-island nodes (0-53) are not assigned an island', () => {
    for (let n = 0; n < 54; n++) expect(NODE_ISLAND[n]).toBeUndefined();
  });
});

describe('sea edges', () => {
  it('SEA_EDGES is the union of transit and within-island edges', () => {
    expect(SEA_EDGES.size).toBe(new Set([...SEA_TRANSIT_EDGES, ...OUTER_ISLAND_EDGES]).size);
  });

  it('every transit edge touches at least one outer node, and none connects two main-island nodes', () => {
    // SEA_TRANSIT_EDGES intentionally includes both main->outer edges AND
    // outer->outer "inter-island connector" edges (see the source comments:
    // island A -> island B -> gold) — so we only assert the one invariant
    // that actually holds: never main-to-main.
    for (const e of SEA_TRANSIT_EDGES) {
      const a = parseInt(e.slice(0, 2), 10);
      const b = parseInt(e.slice(2, 4), 10);
      const bothMain = a < 54 && b < 54;
      expect(bothMain).toBe(false);
    }
  });

  it('every main->outer transit edge has a coastal node as its main-island endpoint', () => {
    for (const e of SEA_TRANSIT_EDGES) {
      const a = parseInt(e.slice(0, 2), 10);
      const b = parseInt(e.slice(2, 4), 10);
      if (a >= 54 && b >= 54) continue; // skip inter-island connector edges
      const mainNode = a < 54 ? a : b;
      expect(COASTAL_NODES.has(mainNode)).toBe(true);
    }
  });

  it('every within-island edge connects two nodes on the same island', () => {
    for (const e of OUTER_ISLAND_EDGES) {
      const a = parseInt(e.slice(0, 2), 10);
      const b = parseInt(e.slice(2, 4), 10);
      expect(NODE_ISLAND[a]).toBe(NODE_ISLAND[b]);
    }
  });
});

describe('COASTAL_NODES', () => {
  it('only contains valid main-board node ids', () => {
    for (const n of COASTAL_NODES) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(54);
    }
  });

  it('is non-empty (the board has at least one coastal node)', () => {
    expect(COASTAL_NODES.size).toBeGreaterThan(0);
  });
});

describe('SEAFARERS_BOARD_NODES', () => {
  it('has 54 + 18 = 72 nodes total', () => {
    expect(SEAFARERS_BOARD_NODES).toHaveLength(72);
  });

  it('outer nodes have at least 2 adjacent nodes within their own island ring', () => {
    for (const node of SEAFARERS_BOARD_NODES.slice(54)) {
      expect(node.adjacentNodes.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('outerNodeNeighbours', () => {
  it('returns the two ring-neighbours on the same island', () => {
    for (const n of OUTER_NODES) {
      const [a, b] = outerNodeNeighbours(n);
      expect(NODE_ISLAND[a]).toBe(NODE_ISLAND[n]);
      expect(NODE_ISLAND[b]).toBe(NODE_ISLAND[n]);
      expect(a).not.toBe(n);
      expect(b).not.toBe(n);
    }
  });
});
