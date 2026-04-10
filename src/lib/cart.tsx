'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
  ref: string;
  nom: string;
  image_url?: string;
  couleur?: string;
  couleur_hexa?: string;
  qty: number;
  prix_from?: number;
  categorie?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (item: CartItem) => void;
  remove: (ref: string, couleur?: string) => void;
  updateQty: (ref: string, couleur: string | undefined, qty: number) => void;
  clear: () => void;
}

// ─── Storage key ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'toque2me_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Clé unique d'un item (ref + couleur) ───────────────────────────────────

function itemKey(ref: string, couleur?: string): string {
  return `${ref}__${couleur || '_'}`;
}

// ─── Context ────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Charger depuis localStorage au mount
  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  // Persister à chaque changement
  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const add = useCallback((item: CartItem) => {
    setItems(prev => {
      const key = itemKey(item.ref, item.couleur);
      const existing = prev.find(i => itemKey(i.ref, i.couleur) === key);
      if (existing) {
        return prev.map(i =>
          itemKey(i.ref, i.couleur) === key
            ? { ...i, qty: i.qty + item.qty }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((ref: string, couleur?: string) => {
    const key = itemKey(ref, couleur);
    setItems(prev => prev.filter(i => itemKey(i.ref, i.couleur) !== key));
  }, []);

  const updateQty = useCallback((ref: string, couleur: string | undefined, qty: number) => {
    const key = itemKey(ref, couleur);
    if (qty <= 0) {
      setItems(prev => prev.filter(i => itemKey(i.ref, i.couleur) !== key));
    } else {
      setItems(prev => prev.map(i =>
        itemKey(i.ref, i.couleur) === key ? { ...i, qty } : i
      ));
    }
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, add, remove, updateQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
