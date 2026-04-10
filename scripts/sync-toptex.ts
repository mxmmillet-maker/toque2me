import { config } from 'dotenv';
config({ path: '.env.local' });

import { ToptexAdapter } from '../src/workers/adapters/toptex';
import { syncSupplier } from '../src/workers/lib/sync-engine';

syncSupplier(ToptexAdapter).then(r => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
