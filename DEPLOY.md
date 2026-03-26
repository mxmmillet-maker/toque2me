# Toque2Me — Guide de mise en production

## 1. Variables d'environnement Vercel

Dans le dashboard Vercel → Settings → Environment Variables, ajouter :

```
NEXT_PUBLIC_SUPABASE_URL=https://lxckfaedvhnosgmctqjo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
CRON_SECRET=(générer un token aléatoire de 32 chars)
CYBERNECARD_LOGIN=ES47
CYBERNECARD_API_KEY=A9372
```

## 2. Déploiement

```bash
git push origin main
```

Vercel détecte automatiquement → build → deploy en 2 min.

## 3. Premier lancement des workers

Après le premier deploy, lancer manuellement chaque sync :

```bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" https://toque2me.fr/api/cron/sync-cybernecard
```

Vérifier les logs dans le dashboard Vercel → Functions.

## 4. DNS (Cloudflare → Vercel)

- Type: CNAME
- Name: @ (ou toque2me.fr)
- Target: cname.vercel-dns.com
- Proxy: DNS only (pas de proxy Cloudflare)

Puis dans Vercel → Settings → Domains → Add toque2me.fr

## 5. Supabase — RLS à activer

Dans Supabase SQL Editor, exécuter :

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogue_public" ON products FOR SELECT USING (actif = true);

ALTER TABLE margins ENABLE ROW LEVEL SECURITY;
-- Pas de policy publique = accessible seulement via service role

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_quotes" ON quotes FOR ALL USING (auth.uid() = client_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON clients FOR ALL USING (auth.uid() = id);
```

## 6. Admin

Assigner le rôle admin à votre user Supabase :

```sql
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}' WHERE email = 'votre@email.com';
```

## 7. Vérifications post-deploy

- [ ] https://toque2me.fr → page d'accueil
- [ ] /catalogue → produits affichés
- [ ] /configurateur → flow complet
- [ ] /restaurateurs → pack interactif
- [ ] /api/cron/sync-cybernecard → 401 sans token
- [ ] /sitemap.xml → sitemap généré
- [ ] /robots.txt → API exclue
