import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Toque2Me';
  const subtitle = searchParams.get('subtitle') || 'Textile & objets personnalisés pour professionnels';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          padding: '60px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            marginBottom: 24,
            letterSpacing: '-2px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#a0a0a0',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 18,
            color: '#666',
          }}
        >
          Devis en 3 minutes — Conformité réglementaire incluse
        </div>
        <div
          style={{
            marginTop: 40,
            padding: '12px 32px',
            backgroundColor: '#333',
            borderRadius: 8,
            fontSize: 16,
            color: 'white',
          }}
        >
          toque2me.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
