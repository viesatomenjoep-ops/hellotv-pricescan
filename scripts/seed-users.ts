/**
 * Maakt drie gebruikers (admin/sales/warehouse) + profielen met rol (G1).
 * Lokaal: `pnpm db:seed-users`. Remote: zet SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Wachtwoord voor alle drie: PriceScan!2026  (wijzig na eerste login).
 */
import './load-env';
import { createClient } from '@supabase/supabase-js';

const LOCAL_URL = 'http://127.0.0.1:55321';
const LOCAL_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const url = process.env.SUPABASE_URL ?? LOCAL_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? LOCAL_SERVICE_KEY;
const db = createClient(url, key, { auth: { persistSession: false } });

const PASSWORD = 'PriceScan!2026';
const USERS: Array<{ email: string; role: 'admin' | 'sales' | 'warehouse'; name: string }> = [
  { email: 'admin@hellotv.local', role: 'admin', name: 'Auke Admin' },
  { email: 'sales@hellotv.local', role: 'sales', name: 'Sander Sales' },
  { email: 'warehouse@hellotv.local', role: 'warehouse', name: 'Wietske Warehouse' },
];

async function findUserId(email: string): Promise<string | undefined> {
  const { data } = await db.auth.admin.listUsers();
  return data.users.find((u) => u.email === email)?.id;
}

async function main() {
  console.log(`Gebruikers seeden tegen ${url}\n`);
  for (const u of USERS) {
    const { data, error } = await db.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
    });
    let id = data?.user?.id;
    if (error) id = await findUserId(u.email); // bestaat al
    if (!id) throw new Error(`Kon gebruiker ${u.email} niet aanmaken: ${error?.message}`);

    const { error: pErr } = await db
      .from('profiles')
      .upsert({ id, full_name: u.name, role: u.role });
    if (pErr) throw pErr;
    console.log(`  ${u.role.padEnd(10)} ${u.email}  (wachtwoord: ${PASSWORD})`);
  }
  console.log('\nKlaar.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
