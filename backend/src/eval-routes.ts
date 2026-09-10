import { Express, Request, Response } from 'express';
import { EventType } from '@prisma/client';
import { EMPTY_DEV_CARDS } from './game/catan';
import type { PlayerState, BoardOccupancy, DevCardCounts } from './game/catan';
import { getAgentDecision } from './game/ai';
import type { RobberPayload, KnightPayload, SeafarersContext } from './game/ai';
import { validateName } from './name-moderation';
import { generateAiSummary } from './summary';
import type { Trait } from './game/personality';

/**
 * Eval-only routes. These call the exact same functions the real app uses
 * (getAgentDecision, generateAiSummary, validateName) but skip the database
 * and the rest of the game/match lifecycle, so a Python eval suite can drive
 * them directly and repeatably over HTTP.
 *
 * Mounted only when ENABLE_EVAL_ROUTES=true — never enable this in production,
 * it has no auth and is meant for local/CI eval runs only.
 */
export function registerEvalRoutes(app: Express) {
  function player(p: Partial<PlayerState> & { agentId: number }): PlayerState {
    return {
      name: `Agent${p.agentId}`,
      wood: 0, brick: 0, ore: 0, wheat: 0, sheep: 0,
      settlementNodes: [], cityNodes: [], roadEdges: [], shipEdges: [],
      devCards: { ...EMPTY_DEV_CARDS } as DevCardCounts,
      knightsPlayed: 0, hasLargestArmy: false, hasLongestRoad: false, islandVPs: 0,
      ...p,
    };
  }

  app.post('/api/eval/agent-decision', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        agentName: string;
        traits: Trait[];
        player: Partial<PlayerState> & { agentId: number };
        opponents?: (Partial<PlayerState> & { agentId: number })[];
        turn?: number;
        dice?: number;
        occupancy?: BoardOccupancy;
        robberPayload?: RobberPayload;
        knightPayload?: KnightPayload;
        extraActions?: string[];
        seafarersCtx?: SeafarersContext;
      };

      const occupancy: BoardOccupancy = body.occupancy ?? { settlements: [], cities: [], roads: [] };
      const opponents = (body.opponents ?? []).map(player);

      const decision = await getAgentDecision(
        body.agentName,
        player(body.player),
        opponents,
        body.dice ?? 7,
        body.turn ?? 1,
        occupancy,
        body.robberPayload,
        body.knightPayload,
        body.traits,
        body.extraActions,
        body.seafarersCtx,
      );

      res.json(decision);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/eval/match-summary', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        gameType: string;
        winnerName: string;
        agents: { name: string; score: number }[];
        events: { type: keyof typeof EventType; text: string; actorName?: string }[];
      };

      // Build a plain object with the same shape generateAiSummary reads from
      // (match.winner.name, match.agents[i].agent.name/score, match.events[i].{type,text,actor.name}).
      const fakeMatch = {
        gameType: body.gameType,
        winner: { name: body.winnerName },
        agents: body.agents.map(a => ({ agent: { name: a.name }, score: a.score })),
        events: body.events.map(e => ({
          type: EventType[e.type],
          text: e.text,
          actor: e.actorName ? { name: e.actorName } : null,
        })),
      };

      const summary = await generateAiSummary(fakeMatch as never);
      res.json({ summary });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/eval/validate-name', async (req: Request, res: Response) => {
    try {
      const name = (req.body as { name?: string }).name ?? '';
      const allowed = await validateName(name);
      res.json({ name, allowed });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
}
