'use client';

import { useState } from 'react';

// ─── TYPES ─────────────────────────────────────────────

export interface ExtractedBrief {
  univers: 'lifestyle' | 'workwear' | 'accessoires' | null;
  usage: 'communication' | 'quotidien' | 'evenement' | null;
  secteur: 'restauration' | 'btp' | 'industrie' | 'sante' | 'nettoyage' | 'securite' | 'espaces_verts' | null;
  typologies: string[];
  nb_personnes: number | null;
  deadline: string | null;
  marquage: boolean | null;
  style: 'casual' | 'chic' | 'sportswear' | 'classique' | null;
  couleurs: string[] | null;
  confidence: number;
}

interface BriefInputProps {
  onExtracted: (data: ExtractedBrief) => void;
}

// ─── HELPERS ───────────────────────────────────────────

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  } catch {
    return iso;
  }
}

function buildSummary(data: ExtractedBrief): string {
  const parts: string[] = [];

  if (data.nb_personnes) {
    const typos = data.typologies.length > 0
      ? data.typologies.map((t) => t.toLowerCase()).join(' + ')
      : 'articles';
    parts.push(`${data.nb_personnes} ${typos}`);
  } else if (data.typologies.length > 0) {
    parts.push(data.typologies.join(', '));
  }

  const usageLabels: Record<string, string> = {
    communication: 'communication',
    quotidien: 'usage quotidien',
    evenement: 'evenement',
  };
  if (data.usage) parts.push(usageLabels[data.usage] || data.usage);

  const secteurLabels: Record<string, string> = {
    restauration: 'restauration',
    btp: 'BTP',
    industrie: 'industrie',
    sante: 'sante',
    nettoyage: 'nettoyage',
    securite: 'securite',
    espaces_verts: 'espaces verts',
  };
  if (data.secteur) parts.push(secteurLabels[data.secteur] || data.secteur);

  if (data.marquage === true) parts.push('marquage');
  if (data.couleurs && data.couleurs.length > 0) parts.push(data.couleurs.join(', '));
  if (data.style) parts.push(`style ${data.style}`);

  const dl = formatDeadline(data.deadline);
  if (dl) parts.push(`deadline ${dl}`);

  return parts.join(', ');
}

// ─── COMPONENT ─────────────────────────────────────────

export function BriefInput({ onExtracted }: BriefInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch('/api/agent/extract-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erreur lors de l\'analyse. Reessayez.');
        return;
      }

      const data: ExtractedBrief = await res.json();
      setSummary(buildSummary(data));
      onExtracted(data);
    } catch {
      setError('Erreur de connexion. Reessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Decrivez votre besoin en quelques mots... Ex: 200 polos brodes pour un seminaire dans 3 semaines"
        rows={3}
        disabled={loading}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50 placeholder:text-neutral-400"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={loading || !text.trim()}
          className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-30 transition-colors inline-flex items-center gap-2"
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {loading ? 'Analyse en cours...' : 'Analyser mon besoin'}
        </button>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {summary && (
        <div className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700">
          <span className="text-green-600 font-medium mr-1.5">OK</span>
          {summary}
        </div>
      )}
    </div>
  );
}
