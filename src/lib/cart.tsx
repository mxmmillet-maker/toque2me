'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CartItemColor {
  nom: string;
  hexa: string;
  image?: string;
}

export interface CartItem {
  ref: string;
  nom: string;
  image_url?: string;
  couleur?: string;
  couleur_hexa?: string;
  qty: number;
  prix_from?: number;
  categorie?: string;
  groupe: string; // nom du sous-panier
  couleurs_dispo?: CartItemColor[]; // pour changer la couleur depuis le panier
}

interface CartContextValue {
  items: CartItem[];
  groupes: string[];
  count: number;
  add: (item: Omit<CartItem, 'groupe'> & { groupe?: string }) => void;
  remove: (ref: string, couleur?: string) => void;
  updateQty: (ref: string, couleur: string | undefined, qty: number) => void;
  updateCouleur: (ref: string, oldCouleur: string | undefined, newCouleur: string, newHexa: string, newImage?: string) => void;
  moveToGroupe: (ref: string, couleur: string | undefined, groupe: string) => void;
  addGroupe: (name: string) => void;
  removeGroupe: (name: string) => void;
  renameGroupe: (oldName: string, newName: string) => void;
  clear: () => void;
}

// ─── Storage ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'toque2me_cart';
const DEFAULT_GROUPE = 'Mon panier';

function loadCart(): { items: CartItem[]; groupes: string[] } {
  if (typeof window === 'undefined') return { items: [], groupes: [DEFAULT_GROUPE] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], groupes: [DEFAULT_GROUPE] };
    const parsed = JSON.parse(raw);
    // Compat: ancien format = array d'items sans groupe
    if (Array.isArray(parsed)) {
      return {
        items: parsed.map((i: any) => ({ ...i, groupe: i.groupe || DEFAULT_GROUPE })),
        groupes: [DEFAULT_GROUPE],
      };
    }
    return {
      items: (parsed.items || []).map((i: any) => ({ ...i, groupe: i.groupe || DEFAULT_GROUPE })),
      groupes: parsed.groupes?.length ? parsed.groupes : [DEFAULT_GROUPE],
    };
  } catch {
    return { items: [], groupes: [DEFAULT_GROUPE] };
  }
}

function saveCart(items: CartItem[], groupes: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, groupes }));
}

// ─── Key ────────────────────────────────────────────────────────────────────

function itemKey(ref: string, couleur?: string): string {
  return `${ref}__${couleur || '_'}`;
}

// ─── Context ────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [groupes, setGroupes] = useState<string[]>([DEFAULT_GROUPE]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = loadCart();
    setItems(data.items);
    setGroupes(data.groupes);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items, groupes);
  }, [items, groupes, loaded]);

  const add = useCallback((item: Omit<CartItem, 'groupe'> & { groupe?: string }) => {
    const groupe = item.groupe || DEFAULT_GROUPE;
    setItems(prev => {
      const key = itemKey(item.ref, item.couleur);
      const existing = prev.find(i => itemKey(i.ref, i.couleur) === key && i.groupe === groupe);
      if (existing) {
        return prev.map(i =>
          itemKey(i.ref, i.couleur) === key && i.groupe === groupe
            ? { ...i, qty: i.qty + item.qty }
            : i
        );
      }
      return [...prev, { ...item, groupe }];
    });
    // Auto-create groupe if needed
    setGroupes(prev => prev.includes(groupe) ? prev : [...prev, groupe]);
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

  const updateCouleur = useCallback((ref: string, oldCouleur: string | undefined, newCouleur: string, newHexa: string, newImage?: string) => {
    const key = itemKey(ref, oldCouleur);
    setItems(prev => prev.map(i =>
      itemKey(i.ref, i.couleur) === key
        ? { ...i, couleur: newCouleur, couleur_hexa: newHexa, image_url: newImage || i.image_url }
        : i
    ));
  }, []);

  const moveToGroupe = useCallback((ref: string, couleur: string | undefined, groupe: string) => {
    const key = itemKey(ref, couleur);
    setItems(prev => prev.map(i =>
      itemKey(i.ref, i.couleur) === key ? { ...i, groupe } : i
    ));
    setGroupes(prev => prev.includes(groupe) ? prev : [...prev, groupe]);
  }, []);

  const addGroupe = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGroupes(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  }, []);

  const removeGroupe = useCallback((name: string) => {
    if (name === DEFAULT_GROUPE) return; // Can't remove default
    setItems(prev => prev.map(i => i.groupe === name ? { ...i, groupe: DEFAULT_GROUPE } : i));
    setGroupes(prev => prev.filter(g => g !== name));
  }, []);

  const renameGroupe = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    setItems(prev => prev.map(i => i.groupe === oldName ? { ...i, groupe: trimmed } : i));
    setGroupes(prev => prev.map(g => g === oldName ? trimmed : g));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setGroupes([DEFAULT_GROUPE]);
  }, []);

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, groupes, count, add, remove, updateQty, updateCouleur, moveToGroupe, addGroupe, removeGroupe, renameGroupe, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
