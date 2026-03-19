# Toque2Me — Workers Fournisseurs

## Structure

```
workers/
├── index.ts                    ← point d'entrée, exporte tout
├── lib/
│   ├── types.ts                ← interfaces communes (SupplierAdapter, NormalizedProduct...)
│   └── sync-engine.ts          ← moteur générique (timeout, batch upsert, logs)
└── adapters/
    ├── cybernecard.ts           ← API REST (clé disponible)
    ├── toptex.ts                ← XML ou CSV selon le flux fourni
    ├── makito.ts                ← XML Google Shopping Feed
    └── bic-graphic.ts           ← JSON API
```

## Ajouter un nouveau fournisseur

1. Créer `workers/adapters/mon-fournisseur.ts`
2. Implémenter l'interface `SupplierAdapter` :
   ```typescript
   export const MonFournisseurAdapter: SupplierAdapter = {
     name: 'mon_fournisseur',
     async fetchProducts() { /* appel API/flux */ },
     mapProduct(raw) { /* mapping vers NormalizedProduct */ },
   };
   ```
3. L'enregistrer dans `workers/index.ts`
4. Créer la route cron `app/api/cron/sync-mon-fournisseur/route.ts`
5. Ajouter le cron dans `vercel.json`

**Temps estimé : 3-4h**

## Routes Cron Next.js (à créer en Sprint 1)

```
app/api/cron/
├── sync-cybernecard/route.ts
├── sync-toptex/route.ts
├── sync-makito/route.ts
├── sync-bic/route.ts
└── cleanup-rgpd/route.ts
```

Chaque route vérifie le header `Authorization: Bearer CRON_SECRET`.

## Variables d'environnement requises

```
CYBERNECARD_LOGIN=ES47
CYBERNECARD_API_KEY=...       ← à renouveler (sécurité)

TOPTEX_FEED_URL=...
TOPTEX_API_KEY=...

MAKITO_FEED_URL=...
MAKITO_API_KEY=...

BIC_GRAPHIC_FEED_URL=...
BIC_GRAPHIC_API_KEY=...

SUPABASE_SERVICE_ROLE_KEY=... ← NE JAMAIS préfixer avec NEXT_PUBLIC_
CRON_SECRET=...               ← token aléatoire fort (openssl rand -hex 32)
```

## Points d'attention techniques

### Timeout Vercel (CRITIQUE)
Vercel coupe les fonctions serverless à **10 secondes** en free tier.
Le sync-engine timeout à **9 secondes** pour éviter un crash silencieux.
Si un fournisseur est trop lent → log d'erreur partiel, pas de crash.

### Batch upsert (PERFORMANCE)
Le sync-engine fait UN seul appel `supabase.upsert()` pour tous les produits.
**Jamais** de boucle `for (product of products) { await supabase.insert(product) }`.
Différence : ~30s vs ~2s pour 500 produits.

### Index composite (DOUBLONS)
La table `products` a un index `UNIQUE(fournisseur, ref_fournisseur)`.
Deux fournisseurs peuvent utiliser la même référence interne sans conflit.

### Actif = false par défaut
Tous les produits importés arrivent avec `actif = false`.
Seuls les 80 produits de lancement sont activés manuellement (T-13).
Cela évite d'exposer des fiches incomplètes sur le site.
