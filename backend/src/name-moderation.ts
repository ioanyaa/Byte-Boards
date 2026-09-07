import { callGemini, hasGeminiKey } from './game/gemini-client';

const BLOCKLIST_RE = /\b(dick|cock|penis|vagina|pussy|fuck|shit|ass|bitch|bastard|cunt|whore|slut|pula|pizda|muie|cacat|futut|futu|cur|prost|idiot|retard|nigger|faggot|suge|sugeo|suge-o)\b/;

export function blocklisted(name: string): boolean {
  const normalized = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');
  return BLOCKLIST_RE.test(normalized);
}

export async function validateName(name: string): Promise<boolean> {
  // Always apply local blocklist first — works even when Gemini is rate-limited
  if (blocklisted(name)) {
    console.log(`[validateName] "${name}" → BLOCKED by local blocklist`);
    return false;
  }

  if (!hasGeminiKey()) return true;

  const userPrompt = `Name: "${name}"`;
  const systemPrompt = 'You are a strict content moderator for a game platform. Reply with exactly one word: CLEAN or OFFENSIVE. The name is OFFENSIVE if it contains profanity, slurs, sexual references, or hate speech in any language — including Romanian words like pula, pizda, muie, cacat, or similar expressions.';
  try {
    const raw = await callGemini(userPrompt, systemPrompt, { maxOutputTokens: 5, temperature: 0, responseMimeType: 'text/plain' });
    const verdict = raw.trim().toUpperCase();
    console.log('═══════════════════════════════════════════');
    console.log('[validateName] SYSTEM :', systemPrompt);
    console.log('[validateName] USER   :', userPrompt);
    console.log('[validateName] RAW    :', JSON.stringify(raw));
    console.log('[validateName] VERDICT:', verdict);
    console.log('[validateName] RESULT :', verdict.includes('OFFENSIVE') ? 'BLOCKED' : 'ALLOWED');
    console.log('═══════════════════════════════════════════');
    return !verdict.includes('OFFENSIVE');
  } catch (err) {
    console.warn('[validateName] Gemini unavailable — falling back to local blocklist only:', (err as Error).message);
    return true;
  }
}
