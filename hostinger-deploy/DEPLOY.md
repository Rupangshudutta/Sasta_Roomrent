# Hostinger Deployment Guide — Sasta Room Rent

## Overview
- **Domain**: `sastaroomrent.com` (or `www.sastaroomrent.com`)
- **Frontend**: Angular 17 SPA → Hostinger `public_html/`
- **Backend**: Node.js (Express) → Hostinger Node.js hosting
- **Database**: MySQL → Hostinger database panel

---

## Step 1: Set Up MySQL Database

1. Log into **Hostinger hPanel** → **Databases** → **MySQL Databases**
2. Create a new database: `sasta_room`
3. Create a MySQL user and assign full permissions
4. Open **phpMyAdmin** and import `backend/schema.sql`

---

## Step 2: Configure Backend Environment

1. In the backend directory, copy `.env.example` → `.env`
2. Fill in the Hostinger MySQL credentials:
   ```
   DB_HOST=localhost
   DB_NAME=<your_db_name>
   DB_USER=<your_db_user>
   DB_PASSWORD=<your_password>
   JWT_SECRET=<generate_a_long_random_string>
   FRONTEND_URL=https://sastaroomrent.com
   ```

---

## Step 3: Build the Backend

```bash
cd backend
npm install --production
npm run build
# Output: backend/dist/
```

---

## Step 4: Build the Angular Frontend

```bash
cd frontend
npm install
ng build --configuration=production
# Output: frontend/dist/sasta-room-frontend/browser/
```

---

## Step 5: Upload Frontend to Hostinger

1. Go to **hPanel** → **File Manager** → `public_html/`
2. Delete any existing `index.html`
3. Upload all contents of `frontend/dist/sasta-room-frontend/browser/` to `public_html/`
4. Upload `.htaccess` from `hostinger-deploy/` to `public_html/`

---

## Step 6: Deploy Backend on Hostinger Node.js

1. In **hPanel** → **Node.js** → Create a new Node.js app
2. Set the entry point to `dist/app.js`
3. Set Node.js version to **18.x** or higher
4. Upload the `backend/` folder (especially `src/`, `dist/`, `package.json`, `.env`)
5. Install dependencies on server:
   ```bash
   npm install --production
   ```
6. Start with PM2 (recommended):
   ```bash
   npm install -g pm2
   pm2 start pm2.config.js
   pm2 save
   pm2 startup
   ```

---

## Step 7: Configure Domain & SSL

1. In **hPanel** → **Domains** → point `sastaroomrent.com` to `public_html/`
2. Enable **Free SSL** from Hostinger
3. Ensure `HTTPS` redirect is enabled

---

## Step 8: Test Deployment

- `https://sastaroomrent.com` → Angular app loads
- `https://sastaroomrent.com/api/health` → `{"success":true,"message":"Sasta Room API is running"}`
- Try logging in and browsing properties

---

## Production Checklist

- [ ] MySQL database created and schema imported
- [ ] `.env` configured with production credentials
- [ ] Backend built (`npm run build`)
- [ ] Angular built (`ng build --configuration=production`)
- [ ] Frontend uploaded to `public_html/`
- [ ] `.htaccess` uploaded to `public_html/`
- [ ] Backend running via PM2
- [ ] SSL enabled on domain
- [ ] Health check endpoint responds
- [ ] Test login/register flow
