'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  width_mm: number;
  height_mm: number;
}

interface MarkingConfiguratorProps {
  productImage: string;
  productName: string;
  zones: Zone[];
  onConfirm: (config: { zone: Zone; logoUrl: string; technique: string }) => void;
}

const TECHNIQUES = [
  { id: 'serigraphie', label: 'Sérigraphie', sub: '2-4 € HT/pce', best: 'Gros volumes, aplats' },
  { id: 'broderie', label: 'Broderie', sub: '4-8 € HT/pce', best: 'Polos, sweats, premium' },
  { id: 'dtf', label: 'DTF / Transfert', sub: '3-5 € HT/pce', best: 'Photos, dégradés' },
];

export function MarkingConfigurator({ productImage, productName, zones, onConfirm }: MarkingConfiguratorProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(zones[0] || null);
  const [logoUrl, setLogoUrl] = useState('');
  const [technique, setTechnique] = useState('broderie');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.name.endsWith('.svg'))) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-neutral-900">Marquage — {productName}</h3>

      {/* Produit avec zones cliquables */}
      <div className="relative aspect-square bg-neutral-50 rounded-xl overflow-hidden max-w-sm mx-auto">
        <Image src={productImage} alt={productName} fill className="object-cover" sizes="400px" />

        {/* Zones SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <rect
              key={zone.id}
              x={zone.x}
              y={zone.y}
              width={zone.width_mm / 4}
              height={zone.height_mm / 4}
              fill={selectedZone?.id === zone.id ? 'rgba(23,23,23,0.15)' : 'rgba(23,23,23,0.05)'}
              stroke={selectedZone?.id === zone.id ? '#171717' : '#a3a3a3'}
              strokeWidth="0.5"
              strokeDasharray={selectedZone?.id === zone.id ? 'none' : '2,2'}
              rx="1"
              className="cursor-pointer hover:fill-[rgba(23,23,23,0.1)] transition-colors"
              onClick={() => setSelectedZone(zone)}
            />
          ))}
        </svg>

        {/* Logo preview */}
        {logoUrl && selectedZone && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${selectedZone.x}%`,
              top: `${selectedZone.y}%`,
              width: `${selectedZone.width_mm / 4}%`,
              height: `${selectedZone.height_mm / 4}%`,
            }}
          >
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain opacity-80" />
          </div>
        )}
      </div>

      {/* Zone info */}
      {selectedZone && (
        <p className="text-xs text-neutral-500 text-center">
          Zone : {selectedZone.label} — {selectedZone.width_mm} × {selectedZone.height_mm} mm
        </p>
      )}

      {/* Zones selector */}
      {zones.length > 1 && (
        <div className="flex gap-2">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border-2 transition-all ${
                selectedZone?.id === z.id
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-100 hover:border-neutral-300'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      )}

      {/* Upload logo */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileSelect}
          className="hidden"
        />
        {logoUrl ? (
          <div className="flex items-center justify-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            <span className="text-sm text-neutral-600">Logo chargé — cliquez pour changer</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-600 mb-1">Glissez votre logo ici</p>
            <p className="text-xs text-neutral-400">PNG, SVG — ou cliquez pour parcourir</p>
          </>
        )}
      </div>

      {/* Technique */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">Technique de marquage</p>
        <div className="space-y-2">
          {TECHNIQUES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTechnique(t.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                technique === t.id
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-100 hover:border-neutral-300'
              }`}
            >
              <div>
                <span className="text-sm font-medium text-neutral-900">{t.label}</span>
                <span className="text-xs text-neutral-400 ml-2">{t.sub}</span>
              </div>
              <span className="text-[10px] text-neutral-400">{t.best}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => {
          if (selectedZone) {
            onConfirm({ zone: selectedZone, logoUrl, technique });
          }
        }}
        disabled={!selectedZone}
        className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-30 transition-colors"
      >
        Ajouter au devis avec ce marquage
      </button>
    </div>
  );
}
