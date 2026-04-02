import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

// ─── RATE LIMITING ─────────────────────────────────────
const RATE_WINDOW_MS = 3600000; // 1h
const RATE_MAX = 20;

const ipCounts = new Map<string, { count: number; reset: number }>();

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.reset) {
    ipCounts.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  ipCounts.forEach((val, key) => {
    if (now > val.reset) ipCounts.delete(key);
  });
}, 600000);

// ─── TOOL SCHEMA ───────────────────────────────────────

const EXTRACT_BRIEF_TOOL: Anthropic.Tool = {
  name: 'extract_brief',
  description:
    'Extracts structured data from a free-text brief describing a B2B textile/workwear need. ' +
    'Extract as many fields as possible from the text. Leave null when information is not mentioned or cannot be inferred.',
  input_schema: {
    type: 'object' as const,
    properties: {
      univers: {
        type: ['string', 'null'],
        enum: ['lifestyle', 'workwear', 'accessoires', null],
        description: "Main category: 'lifestyle' (t-shirts, polos, sweats for communication/events), 'workwear' (professional clothing for specific trades), 'accessoires' (goodies, mugs, pens...)",
      },
      usage: {
        type: ['string', 'null'],
        enum: ['communication', 'quotidien', 'evenement', null],
        description: "Purpose when univers is lifestyle: 'communication' (brand visibility, client gifts), 'quotidien' (daily team wear), 'evenement' (trade show, seminar, team building)",
      },
      secteur: {
        type: ['string', 'null'],
        enum: ['restauration', 'btp', 'industrie', 'sante', 'nettoyage', 'securite', 'espaces_verts', null],
        description: 'Industry sector, mainly relevant for workwear',
      },
      typologies: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['T-shirts', 'Polos', 'Chemises', 'Sweats', 'Vestes', 'Pantalons', 'Tabliers', 'Accessoires'],
        },
        description: 'Types of garments mentioned or implied',
      },
      nb_personnes: {
        type: ['number', 'null'],
        description: 'Number of people to outfit, or quantity of items if mentioned',
      },
      deadline: {
        type: ['string', 'null'],
        description: "ISO 8601 date string (YYYY-MM-DD). Convert relative dates like 'dans 3 semaines' to an absolute date based on today's date.",
      },
      marquage: {
        type: ['boolean', 'null'],
        description: 'Whether customization/marking is needed (broderie, serigraphie, logo, impression). true if any marking mentioned, false if explicitly said "sans marquage" or "neutre".',
      },
      style: {
        type: ['string', 'null'],
        enum: ['casual', 'chic', 'sportswear', 'classique', null],
        description: 'Desired style for the garments',
      },
      couleurs: {
        type: ['array', 'null'],
        items: { type: 'string' },
        description: 'Colors mentioned (free text, e.g. "bleu marine", "noir", "rouge")',
      },
      confidence: {
        type: 'number',
        description: 'How confident you are in the extraction (0 to 1). Lower if the text is vague or ambiguous.',
      },
    },
    required: ['univers', 'typologies', 'nb_personnes', 'deadline', 'marquage', 'style', 'couleurs', 'confidence'],
  },
};

const SYSTEM_PROMPT = `Tu es l'assistant d'extraction de brief de Toque2Me, une plateforme B2B de textile personnalisé et vêtements professionnels.

L'utilisateur (souvent une agence de communication ou un responsable achats) décrit son besoin en langage naturel. Tu dois extraire les données structurées en utilisant l'outil extract_brief.

Contexte :
- La plateforme vend du textile lifestyle (t-shirts, polos, sweats pour communication/événements), du workwear (vêtements professionnels par secteur), et des accessoires/goodies.
- Les marquages possibles sont : broderie, sérigraphie, DTF/transfert, ou sans marquage.
- "Brodé" / "avec logo" / "personnalisé" / "floqué" = marquage true.
- Pour les deadlines relatives, la date du jour est : ${new Date().toISOString().split('T')[0]}.

Règles :
- Extrais le maximum d'informations possibles à partir du texte.
- Si une information n'est pas mentionnée ou ne peut pas être déduite, laisse null.
- Pour les typologies, déduis à partir du contexte (ex: "polos" → ["Polos"], "tenue de cuisine" → ["Vestes", "Pantalons", "Tabliers"]).
- Pour "200 polos", nb_personnes = 200 (c'est la quantité).
- Sois pragmatique : "séminaire" → usage = "evenement", "équipe terrain" → usage = "quotidien".`;

// ─── HANDLER ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return Response.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 },
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length < 5 || text.length > 2000) {
    return Response.json(
      { error: 'Texte invalide (5 à 2000 caractères).' },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'Service indisponible.' }, { status: 503 });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_BRIEF_TOOL],
      tool_choice: { type: 'tool', name: 'extract_brief' },
      messages: [
        { role: 'user', content: text },
      ],
    });

    // Extract tool_use block
    const toolBlock = response.content.find(
      (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
        block.type === 'tool_use',
    );

    if (!toolBlock) {
      return Response.json(
        { error: 'Extraction échouée. Réessayez avec plus de détails.' },
        { status: 422 },
      );
    }

    return Response.json(toolBlock.input);
  } catch (err) {
    console.error('[extract-brief] Anthropic error:', err);
    return Response.json(
      { error: 'Erreur lors de l\'extraction. Réessayez.' },
      { status: 500 },
    );
  }
}
