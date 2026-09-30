/**
 * Idempotent database migration.
 *
 *   npm run build && npm run migrate
 *
 * 1. Applies every CREATE TABLE IF NOT EXISTS in sql/schema.sql
 * 2. Seeds help-centre articles when the table is empty
 * 3. Creates or updates the admin login from ADMIN_EMAIL / ADMIN_PASSWORD
 *
 * Safe to run on every deploy: nothing here destroys data.
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { pool, query, execute } from '../config/database';
import { HELP_ARTICLES } from './seed-help';

function splitStatements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function applySchema(): Promise<void> {
  // The SQL file lives next to the source tree, not inside dist/.
  const candidates = [
    path.resolve(__dirname, '..', '..', 'sql', 'schema.sql'),
    path.resolve(process.cwd(), 'sql', 'schema.sql'),
    path.resolve(process.cwd(), 'backend', 'sql', 'schema.sql'),
  ];
  const schemaPath = candidates.find((p) => fs.existsSync(p));
  if (!schemaPath) throw new Error(`schema.sql not found (looked in ${candidates.join(', ')})`);

  const statements = splitStatements(fs.readFileSync(schemaPath, 'utf8'));
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log(`✅ Schema applied (${statements.length} statements)`);
}

async function seedHelpArticles(): Promise<void> {
  const [{ c }] = await query<{ c: number }>('SELECT COUNT(*) AS c FROM help_articles');
  if (Number(c) > 0) {
    console.log(`ℹ️  help_articles already has ${c} rows — skipping seed`);
    return;
  }
  for (const a of HELP_ARTICLES) {
    await execute(
      'INSERT INTO help_articles (category, title, content, is_popular, read_time) VALUES (?, ?, ?, ?, ?)',
      [a.category, a.title, a.content, a.is_popular ? 1 : 0, a.read_time]
    );
  }
  console.log(`✅ Seeded ${HELP_ARTICLES.length} help articles`);
}

async function upsertAdmin(): Promise<void> {
  const { email, password } = env.admin;
  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set — admin user not created. Set them and re-run migrate.');
    return;
  }
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  const hash = await bcrypt.hash(password, 10);
  const [existing] = await query<{ id: number; role: string }>('SELECT id, role FROM users WHERE email = ?', [email]);
  if (existing) {
    await execute('UPDATE users SET password = ?, role = "admin", is_active = 1, is_verified = 1 WHERE id = ?', [hash, existing.id]);
    console.log(`✅ Admin ${email} updated (password reset from ADMIN_PASSWORD)`);
  } else {
    await execute(
      `INSERT INTO users (first_name, last_name, email, phone, password, role, is_verified, is_active)
       VALUES ('Admin', 'SastaRoom', ?, NULL, ?, 'admin', 1, 1)`,
      [email, hash]
    );
    console.log(`✅ Admin ${email} created`);
  }
}

export async function migrate(): Promise<void> {
  console.log(`🔄 Migrating ${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name} (ssl=${env.db.ssl})`);
  await applySchema();
  await seedHelpArticles();
  await upsertAdmin();
}

if (require.main === module) {
  migrate()
    .then(() => { console.log('🎉 Migration complete'); return pool.end(); })
    .then(() => process.exit(0))
    .catch(async (err) => {
      console.error('❌ Migration failed:', err?.message || err);
      await pool.end().catch(() => undefined);
      process.exit(1);
    });
}
