'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface Props {
  productImage: string;
  productImageBack?: string;
  productName: string;
}

type Face = 'front' | 'back';

export function MarquageSimulator({ productImage, productImageBack, productName }: Props) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [face, setFace] = useState<Face>('front');
  const [pos, setPos] = useState({ x: 30, y: 20 });
  const [size, setSize] = useState({ w: 30, h: 30 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0 });

  const currentImage = face === 'back' && productImageBack ? productImageBack : productImage;
  const hasBack = !!productImageBack;

  // Upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { alert('SVG, PNG, JPEG ou PDF uniquement'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('10 Mo max'); return; }

    setLogoFile(file);
    if (file.type === 'application/pdf') { setLogoSrc(null); setAspectRatio(1); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setLogoSrc(src);
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        setAspectRatio(ratio);
        setSize(ratio > 1 ? { w: 30, h: 30 / ratio } : { w: 30 * ratio, h: 30 });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ─── Helpers pour normaliser mouse/touch ─────────────────────────────────

  const getClientPos = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if ('clientX' in e) return { x: e.clientX, y: e.clientY };
    return { x: 0, y: 0 };
  };

  // ─── Drag ─────────────────────────────────────────────────────────────────

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getClientPos(e);
    dragStartRef.current = { x, y, posX: pos.x, posY: pos.y };
    setDragging(true);
  }, [pos]);

  const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !containerRef.current) return;
    e.preventDefault();
    const { x, y } = getClientPos(e);
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((x - dragStartRef.current.x) / rect.width) * 100;
    const dy = ((y - dragStartRef.current.y) / rect.height) * 100;
    setPos({
      x: Math.max(0, Math.min(100 - size.w, dragStartRef.current.posX + dx)),
      y: Math.max(0, Math.min(100 - size.h, dragStartRef.current.posY + dy)),
    });
  }, [dragging, size]);

  const stopDrag = useCallback(() => setDragging(false), []);

  // ─── Resize ───────────────────────────────────────────────────────────────

  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getClientPos(e);
    resizeStartRef.current = { x, y, w: size.w };
    setResizing(true);
  }, [size]);

  const onResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!resizing || !containerRef.current) return;
    e.preventDefault();
    const { x } = getClientPos(e);
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((x - resizeStartRef.current.x) / rect.width) * 100;
    const newW = Math.max(10, Math.min(70, resizeStartRef.current.w + dx));
    setSize({ w: newW, h: newW / aspectRatio });
  }, [resizing, aspectRatio]);

  const stopResize = useCallback(() => setResizing(false), []);

  // Global listeners
  useEffect(() => {
    if (dragging) {
      const opts = { passive: false } as AddEventListenerOptions;
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchmove', onDragMove, opts);
      window.addEventListener('touchend', stopDrag);
      return () => { window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', stopDrag); window.removeEventListener('touchmove', onDragMove); window.removeEventListener('touchend', stopDrag); };
    }
  }, [dragging, onDragMove, stopDrag]);

  useEffect(() => {
    if (resizing) {
      const opts = { passive: false } as AddEventListenerOptions;
      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', stopResize);
      window.addEventListener('touchmove', onResizeMove, opts);
      window.addEventListener('touchend', stopResize);
      return () => { window.removeEventListener('mousemove', onResizeMove); window.removeEventListener('mouseup', stopResize); window.removeEventListener('touchmove', onResizeMove); window.removeEventListener('touchend', stopResize); };
    }
  }, [resizing, onResizeMove, stopResize]);

  const removeLogo = () => { setLogoSrc(null); setLogoFile(null); setPos({ x: 30, y: 20 }); setSize({ w: 30, h: 30 }); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Simulateur de marquage</p>
        {/* Sélecteur avant/arrière */}
        {hasBack && (
          <div className="flex bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setFace('front')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${face === 'front' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            >
              Avant
            </button>
            <button
              onClick={() => setFace('back')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${face === 'back' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            >
              Arrière
            </button>
          </div>
        )}
      </div>

      {/* Zone produit + logo */}
      <div
        ref={containerRef}
        className="relative bg-neutral-50 rounded-xl overflow-hidden select-none touch-none"
        style={{ aspectRatio: '1/1' }}
      >
        <Image
          src={currentImage}
          alt={productName}
          fill
          className="object-contain p-4 pointer-events-none"
          draggable={false}
        />

        {/* Logo overlay */}
        {(logoSrc || (logoFile?.type === 'application/pdf')) && (
          <div
            className={`absolute border-2 rounded ${dragging || resizing ? 'border-blue-500 shadow-lg' : 'border-dashed border-neutral-400/60 hover:border-neutral-600'} cursor-move transition-colors`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${size.w}%`, height: `${size.h}%` }}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            {logoSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoSrc} alt="Logo" className="w-full h-full object-contain pointer-events-none" draggable={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/80 rounded">
                <span className="text-[10px] text-neutral-500 truncate px-1">{logoFile?.name}</span>
              </div>
            )}

            {/* Resize corners */}
            <div
              className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-neutral-400 rounded-full cursor-se-resize hover:border-neutral-900 hover:scale-110 transition-all shadow-sm"
              onMouseDown={startResize}
              onTouchStart={startResize}
            />
          </div>
        )}

        {!logoFile && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-white/80 rounded-xl px-4 py-3">
              <p className="text-xs text-neutral-500">Uploadez votre logo</p>
              <p className="text-[10px] text-neutral-400">pour simuler le rendu</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <label className="flex-1 cursor-pointer">
          <input type="file" accept=".svg,.png,.jpg,.jpeg,.webp,.pdf" onChange={handleUpload} className="hidden" />
          <span className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {logoFile ? 'Changer le logo' : 'Mon logo'}
          </span>
        </label>
        {logoFile && (
          <button onClick={removeLogo} className="px-3 py-2.5 text-sm text-neutral-400 hover:text-red-500 border border-neutral-200 rounded-lg transition-colors">
            Retirer
          </button>
        )}
      </div>

      {logoFile && (
        <p className="text-[10px] text-neutral-400 text-center">
          Glissez pour positionner — tirez le coin pour redimensionner
        </p>
      )}
    </div>
  );
}
