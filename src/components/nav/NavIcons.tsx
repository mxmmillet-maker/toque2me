'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export function NavIcons() {
  const { count } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Panier */}
      <Link
        href="/panier"
        className="relative p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-slate-50 transition-colors"
        title="Mon panier"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-neutral-900 text-white text-[10px] font-bold rounded-full px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>

      {/* Compte */}
      <Link
        href={isLoggedIn ? '/espace-client' : '/compte/connexion'}
        className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-slate-50 transition-colors"
        title={isLoggedIn ? 'Mon espace' : 'Connexion'}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </Link>
    </div>
  );
}
