#!/usr/bin/env node
/**
 * End-to-end smoke test for the Sasta Room API.
 *
 *   BASE_URL=https://your-site.vercel.app node scripts/smoke.mjs
 *
 * Always runs the public checks (health, listings, help, contact, sign-up).
 * With SMOKE_ADMIN_EMAIL + SMOKE_ADMIN_PASSWORD it also runs the full
 * owner → admin approval → customer booking → owner acceptance loop, which
 * is the exact path the first customer will take.
 *
 * Test accounts use smoke+<timestamp>@sastaroom.local; remove them with
 * `npm run cleanup:smoke` (needs DB credentials).
 */
const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || '';
const stamp = Date.now();

let failures = 0;
const log = (ok, msg) => { console.log(`${ok ? '  ✅' : '  ❌'} ${msg}`); if (!ok) failures++; };
const expect = (cond, msg) => { log(!!cond, msg); return !!cond; };

async function call(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.arrayBuffer();
  return { status: res.status, headers: res.headers, data };
}

async function tinyJpeg() {
  try {
    const sharp = (await import('sharp')).default;
    return await sharp({ create: { width: 640, height: 480, channels: 3, background: { r: 220, g: 60, b: 40 } } }).jpeg().toBuffer();
  } catch {
    // 1x1 PNG
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  }
}

async function register(role, i) {
  const email = `smoke+${stamp}-${role}${i}@sastaroom.local`;
  const r = await call('POST', '/api/auth/register', {
    body: { first_name: 'Smoke', last_name: role[0].toUpperCase() + role.slice(1), email, password: 'Smoke12345!', phone: `9${String(stamp).slice(-9)}`, role },
  });
  expect(r.status === 201 && r.data?.data?.token, `register ${role} → 201 (${email})`);
  return { token: r.data?.data?.token, user: r.data?.data?.user, email };
}

(async () => {
  console.log(`\nSasta Room smoke test → ${BASE}\n`);

  // ---- public ------------------------------------------------------------
  const health = await call('GET', '/api/health');
  expect(health.status === 200 && health.data?.success, `health → ${health.status} ${JSON.stringify(health.data?.db)} missing=${JSON.stringify(health.data?.missingConfig)}`);

  const list = await call('GET', '/api/properties?limit=3');
  expect(list.status === 200 && Array.isArray(list.data?.data?.properties), `properties list → ${list.status} (${list.data?.data?.total} active)`);

  const help = await call('GET', '/api/help/categories');
  expect(help.status === 200 && help.data?.data?.length > 0, `help categories → ${help.data?.data?.length}`);

  const notFound = await call('GET', '/api/does-not-exist');
  expect(notFound.status === 404 && notFound.data?.success === false, 'unknown route → 404 JSON');

  const contact = await call('POST', '/api/contact', { body: { name: 'Smoke Test', email: `smoke+${stamp}@sastaroom.local`, subject: 'Smoke test', message: 'Automated smoke test message.' } });
  expect(contact.status === 201, `contact form → ${contact.status}`);

  // ---- accounts ----------------------------------------------------------
  const owner = await register('owner', 1);
  const customer = await register('customer', 1);
  const legacy = await call('POST', '/api/auth/register', { body: { first_name: 'Legacy', last_name: 'Owner', email: `smoke+${stamp}-legacy@sastaroom.local`, password: 'Smoke12345!', role: 'room_owner' } });
  expect(legacy.status === 201 && legacy.data?.data?.user?.role === 'owner', 'legacy role "room_owner" is accepted as owner');
  const otherOwnerToken = legacy.data?.data?.token;

  const badLogin = await call('POST', '/api/auth/login', { body: { email: owner.email, password: 'wrong-password' } });
  expect(badLogin.status === 401, 'wrong password → 401');

  // Browsers send an Origin header on same-origin POSTs; the server must never
  // turn that into a 403 (CORS is enforced by the browser, not the API).
  for (const origin of [BASE, 'https://not-allowed.example']) {
    const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ email: owner.email, password: 'wrong-password' }) });
    expect(r.status === 401, `POST with Origin ${origin === BASE ? '(same-origin)' : '(foreign)'} is not rejected server-side → ${r.status}`);
  }
  const me = await call('GET', '/api/auth/me', { token: owner.token });
  expect(me.status === 200 && me.data?.data?.user?.email === owner.email, 'GET /auth/me with token');

  // ---- owner creates a listing ------------------------------------------
  const created = await call('POST', '/api/properties', {
    token: owner.token,
    body: {
      title: `Smoke Test Room ${stamp}`, description: 'Created by the automated smoke test.', property_type: 'single_room',
      rent_amount: 7500, security_deposit: 7500, address_line1: '1 Test Street', city: 'Testpur', state: 'Testland', pincode: '560001',
      bedrooms: 1, bathrooms: 1, furnishing: 'furnished', available_from: '2030-01-01', min_lease_months: 1, max_occupancy: 1,
      amenities: ['WiFi', 'Geyser'],
    },
  });
  const propertyId = created.data?.data?.property?.id;
  expect(created.status === 201 && propertyId && created.data.data.property.status === 'pending', `owner creates listing → ${created.status} id=${propertyId} status=${created.data?.data?.property?.status}`);

  const invalid = await call('POST', '/api/properties', { token: owner.token, body: { title: 'x' } });
  expect(invalid.status === 422 && Array.isArray(invalid.data?.errors), 'invalid listing → 422 with field errors');

  const customerCreate = await call('POST', '/api/properties', { token: customer.token, body: {} });
  expect(customerCreate.status === 403, 'customer cannot create listing → 403');

  // photo upload
  const jpeg = await tinyJpeg();
  const form = new FormData();
  form.append('images', new Blob([jpeg], { type: 'image/jpeg' }), 'room.jpg');
  form.append('is_primary', '1');
  const upload = await call('POST', `/api/properties/${propertyId}/images`, { token: owner.token, form });
  const imageUrl = upload.data?.data?.images?.[0]?.url;
  expect(upload.status === 201 && imageUrl?.startsWith('/api/images/'), `photo upload → ${upload.status} ${imageUrl} (${upload.data?.data?.images?.[0]?.sizeBytes} bytes)`);

  const otherUpload = await call('POST', `/api/properties/${propertyId}/images`, { token: otherOwnerToken, form: (() => { const f = new FormData(); f.append('images', new Blob([jpeg], { type: 'image/jpeg' }), 'x.jpg'); return f; })() });
  expect(otherUpload.status === 403, 'another owner cannot add photos to this listing → 403');

  if (imageUrl) {
    const img = await call('GET', imageUrl);
    expect(img.status === 200 && (img.headers.get('content-type') || '').startsWith('image/') && (img.headers.get('cache-control') || '').includes('max-age'), `photo served → ${img.status} ${img.headers.get('content-type')} ${img.headers.get('cache-control')}`);
  }

  const hiddenList = await call('GET', `/api/properties?search=Smoke%20Test%20Room%20${stamp}`);
  expect(hiddenList.data?.data?.total === 0, 'pending listing is hidden from public search');

  const myProps = await call('GET', '/api/properties/my', { token: owner.token });
  expect(myProps.status === 200 && myProps.data?.data?.properties?.some((p) => p.id === propertyId), 'owner sees pending listing in /properties/my');

  // ---- admin moderation --------------------------------------------------
  let adminToken = '';
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const adminLogin = await call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    adminToken = adminLogin.data?.data?.token || '';
    expect(adminLogin.status === 200 && adminLogin.data?.data?.user?.role === 'admin', `admin login → ${adminLogin.status}`);
  } else {
    console.log('  ⚠️  SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD not set — skipping approval + booking flow');
  }

  if (adminToken) {
    const ownerPending = await call('GET', '/api/properties/pending', { token: owner.token });
    expect(ownerPending.status === 403, 'owner cannot read moderation queue → 403');
    const pending = await call('GET', '/api/properties/pending', { token: adminToken });
    expect(pending.status === 200 && pending.data?.data?.properties?.some((p) => p.id === propertyId && p.owner_phone), 'admin sees listing in moderation queue with owner contact');

    const ownerApprove = await call('PATCH', `/api/properties/${propertyId}/status`, { token: owner.token, body: { status: 'active' } });
    expect(ownerApprove.status === 403, 'owner cannot approve own listing → 403');
    const approve = await call('PATCH', `/api/properties/${propertyId}/status`, { token: adminToken, body: { status: 'active' } });
    expect(approve.status === 200 && approve.data?.data?.property?.status === 'active', 'admin approves listing → active');

    const visible = await call('GET', `/api/properties?search=Smoke%20Test%20Room%20${stamp}`);
    const item = visible.data?.data?.properties?.[0];
    expect(item?.id === propertyId && item?.primary_image === imageUrl, `approved listing is public with cover photo (${item?.primary_image})`);

    const detail = await call('GET', `/api/properties/${propertyId}`);
    expect(detail.status === 200 && detail.data?.data?.property?.images?.length === 1 && detail.data.data.property.amenities?.includes('WiFi'), 'listing detail has images + amenities');

    // ---- booking loop ----------------------------------------------------
    const selfBook = await call('POST', '/api/bookings', { token: owner.token, body: { property_id: propertyId, check_in_date: '2030-02-01', lease_months: 3 } });
    expect(selfBook.status === 400, 'owner cannot book own listing → 400');

    const booking = await call('POST', '/api/bookings', { token: customer.token, body: { property_id: propertyId, check_in_date: '2030-02-01', lease_months: 3, notes: 'Smoke test booking' } });
    const bookingId = booking.data?.data?.booking?.id;
    expect(booking.status === 201 && bookingId && booking.data.data.booking.status === 'pending', `customer requests booking → ${booking.status} id=${bookingId}`);
    expect(booking.data?.data?.booking?.total_amount == 7500 * 3 + 7500, `total_amount = rent×months + deposit (${booking.data?.data?.booking?.total_amount})`);
    expect(!booking.data?.data?.booking?.owner_phone, 'owner phone hidden while pending');

    const dup = await call('POST', '/api/bookings', { token: customer.token, body: { property_id: propertyId, check_in_date: '2030-02-01', lease_months: 3 } });
    expect(dup.status === 409, 'duplicate pending request → 409');

    const ownerView = await call('GET', '/api/bookings', { token: owner.token });
    const ob = ownerView.data?.data?.bookings?.find((b) => b.id === bookingId);
    expect(ob && ob.customer_phone && ob.customer_email, 'owner sees tenant phone + email on the request');

    const otherOwnerView = await call('GET', `/api/bookings/${bookingId}`, { token: otherOwnerToken });
    expect(otherOwnerView.status === 403, 'another owner cannot read this booking → 403');

    const custConfirm = await call('PUT', `/api/bookings/${bookingId}`, { token: customer.token, body: { status: 'confirmed' } });
    expect(custConfirm.status === 403, 'customer cannot self-confirm → 403');

    const confirm = await call('PUT', `/api/bookings/${bookingId}`, { token: owner.token, body: { status: 'confirmed' } });
    expect(confirm.status === 200 && confirm.data?.data?.booking?.status === 'confirmed', 'owner accepts request → confirmed');

    const custView = await call('GET', `/api/bookings/${bookingId}`, { token: customer.token });
    const cb = custView.data?.data?.booking;
    expect(cb?.status === 'confirmed' && cb?.owner_phone && !cb?.customer_email, 'customer now sees owner phone (and never other customer data)');

    const secondBooking = await call('POST', '/api/bookings', { token: otherOwnerToken, body: { property_id: propertyId, check_in_date: '2030-03-01', lease_months: 1 } });
    expect(secondBooking.status === 409, 'confirmed room cannot be booked again → 409');

    // dashboards
    for (const [name, token] of [['owner', owner.token], ['customer', customer.token], ['admin', adminToken]]) {
      const d = await call('GET', `/api/dashboard/${name}`, { token });
      expect(d.status === 200 && d.data?.success, `dashboard/${name} → ${d.status}`);
    }

    const inbox = await call('GET', '/api/contact', { token: adminToken });
    expect(inbox.status === 200 && inbox.data?.data?.messages?.some((m) => m.subject === 'Smoke test'), 'admin inbox contains the contact message');
    const custInbox = await call('GET', '/api/contact', { token: customer.token });
    expect(custInbox.status === 403, 'customer cannot read inbox → 403');

    // tidy: hide the test listing again
    const hide = await call('PATCH', `/api/properties/${propertyId}/status`, { token: adminToken, body: { status: 'inactive' } });
    expect(hide.status === 200, 'test listing hidden again (inactive)');
  }

  console.log(`\n${failures === 0 ? '🎉 ALL CHECKS PASSED' : `💥 ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => { console.error('💥 smoke test crashed:', err); process.exit(1); });
