// Laadt .env.local (en .env) in voordat een seed-script draait, zodat SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY beschikbaar zijn. Stil als de bestanden ontbreken.
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });
