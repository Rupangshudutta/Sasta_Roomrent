/**
 * Removes accounts and data created by scripts/smoke.mjs.
 *   npm run build && npm run cleanup:smoke
 */
import { pool, query, execute } from '../config/database';

async function cleanup(): Promise<void> {
  const users = await query<{ id: number }>("SELECT id FROM users WHERE email LIKE 'smoke+%@sastaroom.local'");
  if (users.length === 0) { console.log('ℹ️  No smoke-test users found'); return; }
  const ids = users.map((u) => u.id);
  const ph = ids.map(() => '?').join(',');
  const props = await query<{ id: number }>(`SELECT id FROM properties WHERE owner_id IN (${ph})`, ids);
  const pids = props.map((p) => p.id);
  if (pids.length) {
    const pph = pids.map(() => '?').join(',');
    await execute(`DELETE FROM bookings WHERE property_id IN (${pph})`, pids);
    await execute(`DELETE FROM properties WHERE id IN (${pph})`, pids); // cascades images/blobs/amenities
  }
  await execute(`DELETE FROM bookings WHERE customer_id IN (${ph})`, ids);
  await execute(`DELETE FROM users WHERE id IN (${ph})`, ids);
  await execute("DELETE FROM contact_messages WHERE email LIKE 'smoke+%@sastaroom.local'");
  console.log(`🧹 Removed ${users.length} smoke-test users and ${pids.length} listings`);
}

cleanup()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch(async (err) => { console.error('❌ cleanup failed:', err?.message || err); await pool.end().catch(() => undefined); process.exit(1); });
