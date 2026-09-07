/**
 * A standalone, DB-free harness that drives a full Catan match using the
 * exact same engine functions the real app uses in `runMatchSimulation`
 * (index.ts): getValidActions, getAgentDecision (heuristic fallback, since
 * tests run with no Gemini key — see vitest.setup.ts), applyAction, and the
 * shared match-state helpers.
 *
 * It intentionally does NOT call runMatchSimulation itself — that function
 * is fused to Prisma (persistence) and SSE (live updates) and isn't
 * exported. This harness mirrors its per-round algorithm closely enough to
 * exercise the same rules engine end-to-end, without needing a database.
 *
 * Scope: classic board only (no Seafarers ships/pirate/exploration VP), and
 * it does not implement play_road_building / play_monopoly's dev-card
 * effects — the heuristic agent rarely holds dev cards in practice (Gemini
 * is what makes dev-card-heavy strategies common), so this keeps the
 * harness focused on the core build/trade/robber loop. Extend it here if
 * you want dev-card-play coverage too.
 */
import type { PlayerState, Resource, DevCardType } from './catan';
import {
  EMPTY_DEV_CARDS, createInitialPlacement, rollDice, collectResources,
  applyAction, computeVP, handleRobber, totalResources, shuffleDeck,
} from './catan';
import { BOARD_TILES, getEligibleRobberTiles } from './graph';
import { getAgentDecision } from './ai';
import type { RobberPayload } from './ai';
import { getAgentTraits } from './personality';
import {
  buildOccupancy, stealRandom, updateLargestArmy, updateLongestRoad,
  TARGET_SCORE, MAX_TURNS,
} from './match-state';

export type SimulatedAgent = { agentId: number; name: string };

export type SimulationResult = {
  winnerId: number;
  /** 'target_reached': someone actually hit TARGET_SCORE mid-game (the
   *  normal win condition). 'turn_limit': the maxTurns cap was hit and the
   *  highest-VP player was declared winner by tiebreak — mirrors index.ts's
   *  own MAX_TURNS handling. In this case the "winner" may hold fewer than
   *  TARGET_SCORE VP. */
  reason: 'target_reached' | 'turn_limit';
  turns: number;
  finalStates: PlayerState[];
  /** Every VP value observed at the end of each round, per agent — used to
   *  assert VP only ever moves in valid ways (see game-simulation.test.ts). */
  vpHistory: { agentId: number; vp: number; turn: number }[];
};

export async function runSimulatedMatch(
  agents: SimulatedAgent[],
  opts: { maxTurns?: number } = {},
): Promise<SimulationResult> {
  const maxTurns = opts.maxTurns ?? MAX_TURNS;

  const stateMap = new Map<number, PlayerState>();
  const takenNodes: number[] = [];
  const takenEdges: string[] = [];
  for (const a of agents) {
    const placement = createInitialPlacement(takenNodes, takenEdges);
    takenNodes.push(...placement.settlementNodes);
    takenEdges.push(...placement.roadEdges);
    stateMap.set(a.agentId, {
      agentId: a.agentId, name: a.name,
      wood: 0, brick: 0, ore: 0, wheat: 0, sheep: 0,
      settlementNodes: placement.settlementNodes,
      cityNodes: placement.cityNodes,
      roadEdges: placement.roadEdges,
      shipEdges: [],
      devCards: { ...EMPTY_DEV_CARDS },
      knightsPlayed: 0, hasLargestArmy: false, hasLongestRoad: false, islandVPs: 0,
    });
  }

  let devDeck: DevCardType[] = shuffleDeck();
  let currentRobberTile = BOARD_TILES.find(t => t.resource === 'desert')!.index;
  const vpHistory: SimulationResult['vpHistory'] = [];

  for (let turn = 1; turn <= maxTurns; turn++) {
    const occupancy = buildOccupancy(stateMap);
    const [d1, d2] = rollDice();
    const total = d1 + d2;

    let robberPayload: RobberPayload | undefined;
    if (total === 7) {
      handleRobber([...stateMap.values()]);
      const eligible = getEligibleRobberTiles(currentRobberTile);
      const targets = eligible
        .map(tileIdx => {
          const tile = BOARD_TILES[tileIdx];
          const players = [...stateMap.values()]
            .filter(p =>
              p.settlementNodes.some(n => tile.nodes.includes(n as never)) ||
              p.cityNodes.some(n => tile.nodes.includes(n as never)))
            .map(p => ({ id: p.agentId, cards: totalResources(p) }));
          return { tile: tileIdx, players };
        })
        .filter(t => t.players.length > 0);
      robberPayload = { eligibleTiles: eligible, targets };
    } else {
      for (const s of stateMap.values()) {
        const gained = collectResources(s, total, BOARD_TILES, currentRobberTile);
        for (const [res, amt] of Object.entries(gained) as [Resource, number][]) {
          s[res] += amt;
        }
      }
    }

    let robberMoved = false;
    for (const a of agents) {
      const s = stateMap.get(a.agentId)!;
      const opponents = [...stateMap.values()].filter(p => p.agentId !== a.agentId);
      const currentRobberPayload = robberMoved ? undefined : robberPayload;
      const traits = getAgentTraits(a.name);

      const { action } = await getAgentDecision(
        a.name, s, opponents, total, turn, occupancy,
        currentRobberPayload, undefined, traits,
      );

      if (action.startsWith('robber:')) {
        const [, tileStr, victimStr] = action.split(':');
        const newTile = parseInt(tileStr, 10);
        if (!isNaN(newTile)) currentRobberTile = newTile;
        if (victimStr) {
          const victim = stateMap.get(parseInt(victimStr, 10));
          if (victim) stealRandom(victim, s);
        }
        robberMoved = true;
      } else if (action === 'buy_dev_card') {
        applyAction(s, action);
        if (devDeck.length > 0) {
          const drawn = devDeck.pop()!;
          s.devCards[drawn] += 1;
        }
      } else {
        applyAction(s, action);
        if (action.startsWith('build_road:') || action.startsWith('build_city:') || action.startsWith('build_settlement:')) {
          updateLongestRoad(stateMap);
        }
      }
      updateLargestArmy(stateMap);

      const vp = computeVP(s);
      vpHistory.push({ agentId: a.agentId, vp, turn });

      if (vp >= TARGET_SCORE) {
        return { winnerId: a.agentId, reason: 'target_reached', turns: turn, finalStates: [...stateMap.values()], vpHistory };
      }
    }
  }

  // Mirrors the real app's MAX_TURNS handling in index.ts: rather than
  // leaving the match unresolved, the highest-VP player is declared the
  // winner (ties broken by seat / array order) once the cap is hit.
  const finalStates = [...stateMap.values()];
  const bySeat = new Map(agents.map((a, i) => [a.agentId, i]));
  const ranked = [...finalStates].sort((a, b) =>
    computeVP(b) - computeVP(a) || bySeat.get(a.agentId)! - bySeat.get(b.agentId)!);
  return { winnerId: ranked[0].agentId, reason: 'turn_limit', turns: maxTurns, finalStates, vpHistory };
}
