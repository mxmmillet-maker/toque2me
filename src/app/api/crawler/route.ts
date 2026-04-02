import { NextRequest, NextResponse } from 'next/server';

// Rate limiting : 5 crawls/heure/IP
const rateLimiter = new Map<string, number[]>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const calls = (rateLimiter.get(ip) || []).filter((t) => now - t < 3600000);
  if (calls.length >= 5) return false;
  calls.push(now);
  rateLimiter.set(ip, calls);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Limite atteinte. Réessayez dans 1 heure.' }, { status: 429 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL requise' }, { status: 400 });
  }

  // Valider l'URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }

  // Protection SSRF — bloquer IPs privées et protocoles dangereux
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Protocole non autorisé' }, { status: 400 });
  }
  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '169.254.', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.', '.internal', '.local'];
  if (blockedPatterns.some(p => hostname === p || hostname.startsWith(p) || hostname.endsWith(p))) {
    return NextResponse.json({ error: 'URL non autorisée' }, { status: 400 });
  }

  try {
    // Timeout 5s
    const res = await fetch(parsedUrl.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Toque2Me-Crawler/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json({
        error: 'Site inaccessible',
        fallback: true,
        message: 'Uploadez votre logo manuellement',
      });
    }

    const html = await res.text();

    // Extraction logo
    const logo = extractLogo(html, parsedUrl);

    // Extraction couleurs
    const colors = extractColors(html);

    // Détection secteur basique
    const sector = detectSector(html);

    return NextResponse.json({ logo, colors, sector, domain: parsedUrl.hostname });
  } catch {
    return NextResponse.json({
      error: 'Site inaccessible ou trop lent',
      fallback: true,
      message: 'Uploadez votre logo manuellement',
    });
  }
}

function extractLogo(html: string, baseUrl: URL): string | null {
  // Priorité : og:image > link[rel=icon] > img avec "logo" dans src/alt/class
  const patterns = [
    /property="og:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="og:image"/i,
    /<link[^>]+rel="(?:icon|shortcut icon|apple-touch-icon)"[^>]+href="([^"]+)"/i,
    /<img[^>]+(?:class|alt|src)="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
    /<img[^>]+src="([^"]*logo[^"]*)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const src = match[1];
      if (src.startsWith('http')) return src;
      if (src.startsWith('//')) return `https:${src}`;
      if (src.startsWith('/')) return `${baseUrl.origin}${src}`;
      return `${baseUrl.origin}/${src}`;
    }
  }

  return null;
}

function extractColors(html: string): string[] {
  const colors = new Set<string>();

  // Extraire les couleurs hex des styles inline et CSS
  const hexMatches = html.match(/#[0-9a-fA-F]{3,8}/g) || [];
  for (const hex of hexMatches) {
    const normalized = hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex.substring(0, 7);

    // Filtrer les couleurs trop communes (noir, blanc, gris)
    if (!['#000000', '#ffffff', '#fff', '#000', '#333333', '#666666', '#999999', '#cccccc'].includes(normalized.toLowerCase())) {
      colors.add(normalized.toLowerCase());
    }
  }

  return Array.from(colors).slice(0, 5);
}

function detectSector(html: string): string | null {
  const text = html.toLowerCase();

  const sectors: [string, string[]][] = [
    ['restaurateur', ['restaurant', 'cuisine', 'chef', 'traiteur', 'menu', 'réservation', 'gastronomie']],
    ['hotelier', ['hôtel', 'hotel', 'chambre', 'hébergement', 'réception', 'séjour']],
    ['btp', ['chantier', 'construction', 'bâtiment', 'travaux', 'btp', 'maçon', 'plombier', 'électricien']],
    ['association', ['association', 'adhérent', 'bénévole', 'club', 'sportif', 'ligue']],
  ];

  let bestSector: string | null = null;
  let bestScore = 0;

  for (const [sector, keywords] of sectors) {
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSector = sector;
    }
  }

  return bestScore >= 2 ? bestSector : null;
}
