import { describe, it, expect } from 'vitest';
import {
  BOARD_TILES, BOARD_NODES, BOARD_EDGES,
  edgeId, parseEdge, getNodeTiles,
  isValidSettlementPlacement, isValidRoadPlacement,
  getEligibleRobberTiles,
} from './graph';

describe('edgeId / parseEdge', () => {
  it('normalizes edge id regardless of argument order', () => {
    expect(edgeId(5, 9)).toBe('0509');
    expect(edgeId(9, 5)).toBe('0509');
  });

  it('pads single-digit node ids to two digits', () => {
    expect(edgeId(1, 2)).toBe('0102');
  });

  it('round-trips through parseEdge', () => {
    expect(parseEdge(edgeId(3, 47))).toEqual([3, 47]);
  });
});

describe('board structure', () => {
  it('has exactly 54 nodes', () => {
    expect(BOARD_NODES).toHaveLength(54);
  });

  it('has exactly 19 tiles', () => {
    expect(BOARD_TILES).toHaveLength(19);
  });

  it('every node has at least 2 adjacent nodes', () => {
    for (const node of BOARD_NODES) {
      expect(node.adjacentNodes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('adjacency is symmetric: if A is adjacent to B, B is adjacent to A', () => {
    for (const node of BOARD_NODES) {
      for (const adj of node.adjacentNodes) {
        expect(BOARD_NODES[adj].adjacentNodes).toContain(node.id);
      }
    }
  });

  it('every board edge connects two mutually-adjacent nodes', () => {
    for (const edge of BOARD_EDGES) {
      const [a, b] = parseEdge(edge);
      expect(BOARD_NODES[a].adjacentNodes).toContain(b);
    }
  });

  it('standard resource distribution: 4 wood, 4 sheep, 4 wheat, 3 ore, 3 brick, 1 desert', () => {
    const counts: Record<string, number> = {};
    for (const t of BOARD_TILES) counts[t.resource] = (counts[t.resource] ?? 0) + 1;
    expect(counts).toEqual({ wood: 4, sheep: 4, wheat: 4, ore: 3, brick: 3, desert: 1 });
  });

  it('getNodeTiles returns only tiles that actually list the node', () => {
    const tiles = getNodeTiles(12);
    expect(tiles.length).toBeGreaterThan(0);
    for (const t of tiles) expect(t.nodes).toContain(12);
  });
});

describe('isValidSettlementPlacement', () => {
  it('allows placement on an unoccupied node with no occupied neighbours', () => {
    expect(isValidSettlementPlacement(0, [], [])).toBe(true);
  });

  it('rejects a node that is already a settlement', () => {
    expect(isValidSettlementPlacement(0, [0], [])).toBe(false);
  });

  it('rejects a node that is already a city', () => {
    expect(isValidSettlementPlacement(0, [], [0])).toBe(false);
  });

  it('rejects a node directly adjacent to an existing settlement (distance rule)', () => {
    const [neighbour] = BOARD_NODES[0].adjacentNodes;
    expect(isValidSettlementPlacement(neighbour, [0], [])).toBe(false);
  });

  it('allows a node two steps away from an existing settlement', () => {
    // Any node not in {0} ∪ adjacentNodes(0) is far enough away.
    const blocked = new Set([0, ...BOARD_NODES[0].adjacentNodes]);
    const farNode = BOARD_NODES.findIndex(n => !blocked.has(n.id));
    expect(farNode).toBeGreaterThanOrEqual(0);
    expect(isValidSettlementPlacement(farNode, [0], [])).toBe(true);
  });
});

describe('isValidRoadPlacement', () => {
  it('rejects an edge that is not part of the board', () => {
    expect(isValidRoadPlacement('0099', [], [], [])).toBe(false);
  });

  it('rejects an edge already occupied by a road', () => {
    const edge = [...BOARD_EDGES][0];
    expect(isValidRoadPlacement(edge, [edge], [], [])).toBe(false);
  });

  it('rejects an edge with no connection to the player\'s network', () => {
    const [a] = BOARD_EDGES;
    // Find some other edge that shares no endpoint with `a`.
    const [pa, pb] = parseEdge(a);
    const disconnected = [...BOARD_EDGES].find(e => {
      const [x, y] = parseEdge(e);
      return e !== a && x !== pa && x !== pb && y !== pa && y !== pb;
    });
    expect(disconnected).toBeDefined();
    expect(isValidRoadPlacement(disconnected!, [], [], [])).toBe(false);
  });

  it('allows an edge touching one of the player\'s settlements', () => {
    const node = 10;
    const edge = edgeId(node, BOARD_NODES[node].adjacentNodes[0]);
    expect(isValidRoadPlacement(edge, [], [node], [])).toBe(true);
  });

  it('allows an edge extending from one of the player\'s existing roads', () => {
    const [n1, n2] = parseEdge([...BOARD_EDGES][0]);
    const existingRoad = edgeId(n1, n2);
    const thirdNode = BOARD_NODES[n2].adjacentNodes.find(n => n !== n1);
    expect(thirdNode).toBeDefined();
    const extension = edgeId(n2, thirdNode!);
    expect(isValidRoadPlacement(extension, [existingRoad], [], [])).toBe(true);
  });
});

describe('getEligibleRobberTiles', () => {
  it('excludes the current robber tile and includes every other tile', () => {
    const eligible = getEligibleRobberTiles(9);
    expect(eligible).not.toContain(9);
    expect(eligible).toHaveLength(BOARD_TILES.length - 1);
  });
});
