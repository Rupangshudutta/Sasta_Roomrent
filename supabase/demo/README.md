# Sample data

The live site starts with 56 **sample listings** (7 cities × 8) so visitors can see how
Sasta Room works. They are not real rooms.

| Safeguard                                                            | Where                                                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `properties.is_demo = true`, only settable by a privileged session   | migration 0018                                                         |
| "Sample" badge on cards, notice on the listing page                  | `components/listings/listing-card.tsx`, `app/(public)/properties/[id]` |
| Booking requests refused by the database                             | trigger `bookings_a_reject_demo_listing`                               |
| Contact number is the platform support line, never a personal number | `demo_listings.sql`                                                    |

## How it was loaded (production, once)

1. A one-off Supabase Edge Function created the 12 sample owner accounts through the Auth
   Admin API (random passwords nobody knows) and the admin account. Using the Admin API
   means GoTrue hashes passwords and creates identities, instead of hand-written rows in
   `auth.users`.
2. `demo_listings.sql` inserted the listings and amenities and wrote a photo plan to the
   private `demo_seed` schema. CI loads the same file in `supabase/tests/100_demo_dataset.sql`.
3. The same function downloaded each Unsplash image, uploaded it to the `property-photos`
   bucket under `<owner_id>/<property_id>/`, and recorded it in `property_photos`.

The function was invoked from SQL with `pg_net`, gated by a one-time token, and replaced by
a stub returning 410 afterwards. Its source is not kept in this repo because it is Deno code
outside the Next.js type-check and lint gates.

Photos: [Unsplash License](https://unsplash.com/license) (free to use, no attribution
required).

## Removing it

```
psql "$DATABASE_URL" -f scripts/db/remove-demo-data.sql
```

Then delete the sample owners' folders from the `property-photos` bucket in Supabase
Studio. Real listings and accounts are untouched (covered by the CI test).
