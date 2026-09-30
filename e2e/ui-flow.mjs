/**
 * Browser end-to-end test: drives the real Angular production bundle through
 * the complete product loop using Playwright + Chromium.
 *
 *   owner registers → lists a room with a photo (compressed in the browser)
 *   → admin approves → customer finds it, sends a booking request
 *   → owner accepts → customer sees the owner's phone number
 *
 * Prerequisites (see .github/workflows/ci.yml for the exact recipe):
 *   - API running on http://127.0.0.1:3000 with a migrated database
 *   - `node e2e/spa-server.js frontend/dist/sasta-room-frontend/browser 4300`
 *     serving the production build with /api proxied to the API
 *
 * Env: UI_BASE (default http://127.0.0.1:4300), UI_ADMIN_EMAIL, UI_ADMIN_PASSWORD,
 *      SHOT_DIR (screenshots), CHROME_PATH (optional executable override)
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = (process.env.UI_BASE || 'http://127.0.0.1:4300').replace(/\/$/, '');
const ADMIN = { email: process.env.UI_ADMIN_EMAIL || 'admin@sastaroom.local', pw: process.env.UI_ADMIN_PASSWORD || 'Admin12345!' };
const SHOT = process.env.SHOT_DIR || 'e2e/screenshots';
fs.mkdirSync(SHOT, { recursive: true });

const stamp = Date.now();
const TITLE = `UI Test Room ${stamp}`;
const OWNER = { email: `ui-owner-${stamp}@example.com`, pw: 'Owner12345!', phone: '9876543210' };
const CUSTOMER = { email: `ui-cust-${stamp}@example.com`, pw: 'Cust12345!', phone: '9123456789' };

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '  ✅' : '  ❌'} ${msg}`); if (!ok) failures++; };

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message));
page.on('dialog', (d) => d.accept());
// Bytes actually sent for each photo upload (multipart bodies are not exposed
// by CDP, so read the Content-Length the browser attached to the request).
const uploads = [];
page.on('request', async (r) => {
  if (!/\/api\/properties\/\d+\/images$/.test(r.url())) return;
  const h = await r.allHeaders().catch(() => ({}));
  uploads.push(Number(h['content-length'] || 0));
});

const logout = () => page.evaluate(() => localStorage.clear());
const login = async ({ email, pw }) => {
  await logout();
  await page.goto(`${BASE}/auth/login`);
  await page.fill('input[formcontrolname="email"]', email);
  await page.fill('input[formcontrolname="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/auth/'), { timeout: 15000 });
};
const register = async ({ email, pw, phone }, role, first, last) => {
  await logout();
  await page.goto(`${BASE}/auth/register`);
  if (role === 'owner') await page.click('button:has-text("Room Owner")');
  await page.fill('input[formcontrolname="first_name"]', first);
  await page.fill('input[formcontrolname="last_name"]', last);
  await page.fill('input[formcontrolname="email"]', email);
  await page.fill('input[formcontrolname="phone"]', phone);
  await page.fill('input[formcontrolname="password"]', pw);
  await page.fill('input[formcontrolname="confirm_password"]', pw);
  await page.click('button[type="submit"]:has-text("Create Account")');
  await page.waitForURL((u) => !u.pathname.startsWith('/auth/'), { timeout: 15000 });
};
const shot = (name) => page.screenshot({ path: `${SHOT}/${name}.png` }).catch(() => {});

try {
  // ---- home renders from the API ----
  await page.goto(BASE);
  await page.locator('app-property-card').first().or(page.getByText('No properties found')).waitFor({ timeout: 20000 });
  check(true, `home loaded (${await page.locator('app-property-card').count()} cards)`);
  await shot('01-home');

  // ---- owner registers and lists a room with a photo ----
  await register(OWNER, 'owner', 'Uma', 'Owner');
  check(page.url().endsWith('/dashboard/owner'), 'owner registered via UI → owner dashboard');

  await page.goto(`${BASE}/list-property`);
  const f = (name, v) => page.fill(`[formcontrolname="${name}"]`, v);
  await f('title', TITLE);
  await page.selectOption('[formcontrolname="property_type"]', 'single_room');
  await f('description', 'Bright room near the metro, created by the browser test.');
  await f('address_line1', '12 Test Lane');
  await f('city', 'Bangalore');
  await f('state', 'Karnataka');
  await f('pincode', '560001');
  await f('rent_amount', '9000');
  await f('security_deposit', '9000');
  await f('available_from', '2030-01-01');
  await page.click('button:has-text("Next")');
  await page.click('.amenity-check:has-text("WiFi")');
  await page.click('button:has-text("Next")');

  // Generate a large photo inside the browser and drop it on the file input,
  // exactly as a phone upload would arrive.
  const originalBytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2400; canvas.height = 1800;
    const c = canvas.getContext('2d');
    const g = c.createLinearGradient(0, 0, 2400, 1800);
    g.addColorStop(0, '#1e78c8'); g.addColorStop(1, '#ee2e24');
    c.fillStyle = g; c.fillRect(0, 0, 2400, 1800);
    for (let i = 0; i < 400; i++) { c.fillStyle = `hsl(${i * 7 % 360} 80% 50%)`; c.fillRect((i * 97) % 2400, (i * 53) % 1800, 60, 60); }
    c.fillStyle = '#fff'; c.font = 'bold 120px sans-serif'; c.fillText('Sasta Room test photo', 200, 900);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.97));
    const file = new File([blob], 'room.jpg', { type: 'image/jpeg' });
    const dt = new DataTransfer(); dt.items.add(file);
    const input = document.querySelector('input[type=file]');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return blob.size;
  });
  await page.waitForSelector('text=Uploaded Photos (1/10)', { timeout: 20000 });
  check(true, `photo accepted (original ${(originalBytes / 1024).toFixed(0)} KB, 2400×1800)`);
  await page.click('button:has-text("Submit Property")');
  await page.waitForSelector('text=Property Submitted!', { timeout: 30000 });
  check(uploads.length === 1, `photo uploaded in its own request after the listing was created (${uploads.length} upload request)`);
  if (uploads[0] > 0) {
    check(uploads[0] < originalBytes && uploads[0] < 1.5 * 1024 * 1024, `browser compressed the photo before upload (${(originalBytes / 1024).toFixed(0)} KB → ${(uploads[0] / 1024).toFixed(0)} KB sent)`);
  } else {
    console.log('  ℹ️  upload size not reported by the browser; server-side size is verified by the API smoke test');
  }
  await shot('02-listing-submitted');

  await page.goto(`${BASE}/dashboard/owner`);
  await page.waitForSelector(`text=${TITLE}`, { timeout: 15000 });
  check(await page.locator('span.badge:has-text("In review")').count() > 0, 'owner dashboard shows the listing as "In review"');
  await shot('03-owner-dashboard');

  // ---- admin approves ----
  await login(ADMIN);
  await page.goto(`${BASE}/dashboard/admin`);
  const row = page.locator('div.d-flex', { hasText: TITLE }).first();
  const approveBtn = row.locator('button:has-text("Approve")');
  await approveBtn.waitFor({ timeout: 15000 });
  check(await row.locator(`a[href="tel:${OWNER.phone}"]`).count() > 0, 'admin queue shows owner phone number');
  await shot('04-admin-queue');
  await approveBtn.click();
  await approveBtn.waitFor({ state: 'detached', timeout: 15000 });
  check(true, 'admin approved the listing from the queue');

  // ---- customer finds it and requests a booking ----
  await register(CUSTOMER, 'customer', 'Chetan', 'Tenant');
  check(true, 'customer registered via UI');

  await page.goto(`${BASE}/properties?search=${encodeURIComponent(TITLE)}`);
  await page.waitForSelector('app-property-card', { timeout: 15000 });
  const cover = await page.locator('app-property-card img').first().getAttribute('src');
  check(cover && cover.startsWith('/api/images/'), `approved listing is public with its uploaded cover photo (${cover})`);
  const coverResp = await page.request.get(`${BASE}${cover}`);
  check(coverResp.status() === 200 && (coverResp.headers()['content-type'] || '').startsWith('image/'), `cover photo served → ${coverResp.status()} ${coverResp.headers()['content-type']}`);

  await page.click('app-property-card a:has-text("View Details")');
  await page.waitForSelector('text=Reserve This Room', { timeout: 15000 });
  check(await page.getByText('WiFi', { exact: false }).count() > 0, 'details page shows amenities');
  await shot('05-property-details');
  await page.click('a:has-text("Reserve This Room")');
  await page.waitForSelector('button:has-text("Request Booking")', { timeout: 15000 });
  await page.click('button:has-text("Request Booking")');
  await page.waitForURL('**/dashboard/customer', { timeout: 15000 });
  await page.waitForSelector('text=Waiting for owner', { timeout: 15000 });
  check(true, 'customer sent booking request → "Waiting for owner"');
  await shot('06-customer-pending');

  // ---- owner accepts ----
  await login(OWNER);
  await page.goto(`${BASE}/dashboard/owner`);
  await page.waitForSelector('button:has-text("Accept")', { timeout: 15000 });
  check(await page.locator(`a[href="tel:${CUSTOMER.phone}"]`).count() > 0, 'owner sees the tenant phone number on the request');
  await page.click('button:has-text("Accept")');
  await page.waitForSelector('span.badge:has-text("Confirmed")', { timeout: 15000 });
  check(true, 'owner accepted the request');
  await shot('07-owner-accepted');

  // ---- customer sees owner contact ----
  await login(CUSTOMER);
  await page.goto(`${BASE}/dashboard/customer`);
  await page.waitForSelector('text=Accepted by owner', { timeout: 15000 });
  check(await page.locator(`a[href="tel:${OWNER.phone}"]`).count() > 0, 'customer now sees the owner phone number');
  await shot('08-customer-confirmed');
} catch (err) {
  failures++;
  console.log('  ❌ UI flow crashed:', String(err.message).split('\n')[0]);
  await shot('99-failure');
}

// Third-party CDNs may be unreachable in sandboxes; only our own errors count.
const relevant = consoleErrors.filter((e) => !/cdn\.jsdelivr|cdnjs|fonts\.g|unsplash|net::ERR|Failed to load resource|favicon/i.test(e));
check(relevant.length === 0, `no unexpected browser console errors (${relevant.length} relevant of ${consoleErrors.length})`);
if (relevant.length) console.log(relevant.slice(0, 5).map((e) => '     ' + e).join('\n'));

await browser.close();
console.log(failures === 0 ? '\n🎉 BROWSER FLOW PASSED\n' : `\n💥 ${failures} BROWSER CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
