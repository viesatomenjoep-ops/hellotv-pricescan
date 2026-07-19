/**
 * D2 match-report: draait de matcher en toont de verdeling auto/review/unmatched.
 *   pnpm match:report
 */
process.env.SUPABASE_URL ??= 'http://127.0.0.1:55321';
process.env.SUPABASE_SERVICE_ROLE_KEY ??=
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

import { matchProducts } from '../lib/matching/match-products';

matchProducts()
  .then((report) => {
    console.log('Match-verdeling:', report);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
