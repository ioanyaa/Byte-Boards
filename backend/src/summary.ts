import { EventType } from '@prisma/client';
import { callGemini } from './game/gemini-client';

// Structural subset of the Prisma match-with-relations shape — kept narrow so
// this module doesn't depend on Prisma's generated payload types directly.
// Any object with at least these fields (e.g. the real Prisma result, or a
// plain object built for evals) can be passed in.
export type SummaryMatch = {
  gameType: string;
  winner: { name: string } | null;
  agents: { agent: { name: string }; score: number }[];
  events: { type: EventType; text: string; actor: { name: string } | null }[];
};

export async function generateAiSummary(match: SummaryMatch): Promise<string> {
  const winnerName = match.winner?.name ?? 'Unknown';
  const fallback = `${winnerName} won the match.`;

  try {
    const standings = match.agents.map(a => `${a.agent.name} ${a.score}VP`).join(', ');

    // Only effective actions — exclude passes, discards, and robber-only moves
    const SKIP = /passes their turn|discards|no discards/i;
    const actions = match.events
      .filter(e => e.type === EventType.MOVE && e.actor && !SKIP.test(e.text))
      .map(e => `${e.actor!.name}: ${e.text}`);

    // Sample spread across the match: first quarter, midpoint, last quarter
    const n = actions.length;
    const picks = n <= 12
      ? actions
      : [
          ...actions.slice(0, 3),
          ...actions.slice(Math.floor(n / 2) - 1, Math.floor(n / 2) + 2),
          ...actions.slice(-4),
        ];

    if (picks.length === 0) {
      console.log('[generateAiSummary] No qualifying MOVE events with an actor — asking Gemini for a standings-only recap. Total events:', match.events.length);
    }

    const gameLabel = match.gameType === 'catan-seafarers' ? 'Catan Seafarers' : 'Catan Classic';

    const prompt = picks.length > 0
      ? `Game: ${gameLabel}. Winner: ${winnerName}. Standings: ${standings}. Key moves: ${picks.join(' | ')}`
      : `Game: ${gameLabel}. Winner: ${winnerName}. Standings: ${standings}. No individual moves were logged for this match.`;

    const systemPrompt = picks.length > 0
      ? 'You are a sports commentator writing a 2-3 sentence match recap for a Catan board game. Focus on how the winner secured their victory — mention specific builds, trades, or steals if present. Be vivid and concrete. Plain text only.'
      : 'You are a sports commentator writing a 2-3 sentence match recap for a Catan board game. No specific moves were recorded for this match — write a short, plausible recap based only on the final standings, framing it as a quieter game decided by steady accumulation rather than a dramatic play. Do not invent, name, or imply any specific build, trade, or steal that was not given to you — stick to what the standings support. Plain text only.';

    const raw = await callGemini(
      prompt,
      systemPrompt,
      { model: process.env.GEMINI_SUMMARY_MODEL ?? 'gemini-3.6-flash', responseMimeType: 'text/plain', maxOutputTokens: 150, temperature: 0.8 },
    );

    const summary = raw.trim();
    if (summary.length <= 10) {
      console.warn('[generateAiSummary] Gemini returned a suspiciously short response — using fallback. Raw:', JSON.stringify(raw));
      return fallback;
    }
    return summary;
  } catch (err) {
    console.warn('[generateAiSummary] Gemini call failed — using fallback:', (err as Error).message);
    return fallback;
  }
}
