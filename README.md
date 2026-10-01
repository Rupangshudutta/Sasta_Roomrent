# Sasta Room — Long-Term Room Rental Marketplace

Broker-free PGs, shared rooms, single rooms and flats for long-term stays in India. Owners list properties, Admin approves listings, Tenants send booking requests, Owners accept, and both sides connect directly.

## Stack

| Layer | Tech |
|---|---|
| Frontend + Backend | Next.js 16, React, TypeScript, Tailwind CSS |
| API | Next.js Route Handlers + Server Actions |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Razorpay |
| Deployment | Netlify |
| DNS / Security | Cloudflare |
| Repository / CI | GitHub + GitHub Actions |

## Repository Layout

```text
sasta-room/
├── app/
│   ├── page.tsx
│   ├── properties/
│   ├── property/[id]/
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── owner/
│   ├── admin/
│   └── api/
│       ├── properties/
│       ├── bookings/
│       ├── payments/
│       ├── reviews/
│       └── contact/
├── components/
├── lib/
│   ├── supabase/
│   ├── razorpay/
│   └── utils/
├── types/
├── public/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .env.local
├── next.config.ts
└── package.json
```

## Core Flow

```text
Owner → Create Listing → Admin Approval → Publish
Tenant → Search → Property → Booking Request
Owner → Accept / Reject → Tenant Contact Shared
Payment → Razorpay → Payment Verification → Supabase
```

## Main Modules

```text
Authentication
Properties & Rooms
Search & Filters
Favorites
Booking Requests
Owner Dashboard
Tenant Dashboard
Admin Dashboard
Reviews
Notifications / Contact
Payments
```

## Security

Supabase Row Level Security controls access by role and ownership. Secrets stay in environment variables. Payment status is verified server-side through Razorpay webhooks.

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local` with Supabase and Razorpay credentials.

## Deployment

```text
GitHub → Netlify → Next.js
                     ↓
                 Supabase
                     ↓
                  Razorpay
```

Development and MVP infrastructure should remain on free tiers until usage requires upgrades.

## Product Direction

Build the MVP first: **search → listing → booking request → owner approval → direct connection**. Add advanced features such as maps, chat, subscriptions, recommendations and automated verification after the core flow is stable.

**Launch guide:** `LAUNCH.md`