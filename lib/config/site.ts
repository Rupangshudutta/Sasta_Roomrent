/**
 * Static site configuration: navigation and labels that are part of the app's
 * information architecture (not business data, which lives in the database).
 */
export const siteConfig = {
  name: "Sasta Room",
  tagline: "Find Your Perfect Long-term Stay",
  description: "Discover PGs, Shared Rooms, Single Rooms & Flats at unbeatable prices",
  foundedYear: 2020,
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerNav = {
  quickLinks: [
    { href: "/", label: "Home" },
    { href: "/properties", label: "Properties" },
    { href: "/locations", label: "Locations" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  support: [
    { href: "/contact#faq", label: "Help Center" },
    { href: "/contact", label: "Contact Us" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/safety", label: "Safety Guidelines" },
  ],
  owners: [
    { href: "/register?role=owner", label: "List Your Property" },
    { href: "/about#owners", label: "Owner Benefits" },
    { href: "/contact", label: "Marketing Support" },
  ],
} as const;

export const propertyTypeLabels = {
  pg: "PG (Paying Guest)",
  shared_room: "Shared Room",
  single_room: "Single Room",
  flat: "Flat / Apartment",
  hostel: "Hostel",
} as const;

export const propertyTypeShortLabels = {
  pg: "PG",
  shared_room: "Shared Room",
  single_room: "Single Room",
  flat: "Flat",
  hostel: "Hostel",
} as const;

export const furnishingLabels = {
  furnished: "Furnished",
  semi_furnished: "Semi-furnished",
  unfurnished: "Unfurnished",
} as const;

export const genderPreferenceLabels = {
  any: "Anyone",
  male: "Male only",
  female: "Female only",
} as const;

/** Rent buckets used by the home page pills and the search filters (INR per month). */
export const rentBuckets = [
  { label: "Under ₹10,000", minRent: undefined, maxRent: 10000 },
  { label: "₹10,000 - ₹20,000", minRent: 10000, maxRent: 20000 },
  { label: "Above ₹20,000", minRent: 20000, maxRent: undefined },
] as const;
