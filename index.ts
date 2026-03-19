/**
 * TOQUE2ME — Workers de synchronisation fournisseurs
 *
 * Architecture : adapter pattern
 * Ajouter un fournisseur = créer 1 fichier dans /adapters + l'enregistrer ici
 *
 * Déclenchement : Vercel Cron Jobs (vercel.json)
 *   Cybernecard : 02h00 chaque nuit
 *   Toptex      : 02h30 chaque nuit
 *   Makito      : 03h00 chaque nuit
 *   BIC Graphic : 03h30 chaque nuit
 *   RGPD cleanup: 04h00 chaque dimanche
 */

export { CyberneCardAdapter } from './adapters/cybernecard';
export { ToptexAdapter }      from './adapters/toptex';
export { MakitoAdapter }      from './adapters/makito';
export { BicGraphicAdapter }  from './adapters/bic-graphic';
export { syncSupplier }       from './lib/sync-engine';
export * from './lib/types';
