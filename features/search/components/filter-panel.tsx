import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import type { Amenity, City } from "@/features/catalog/queries";
import {
  furnishingLabels,
  genderPreferenceLabels,
  propertyTypeShortLabels,
} from "@/lib/config/site";

import { countActiveFilters, type SearchFilter } from "../schema";

type Props = {
  filter: SearchFilter;
  cities: City[];
  amenities: Amenity[];
  /** Unique per rendered instance: the panel is rendered twice (sidebar + mobile) and ids must not collide. */
  idPrefix: string;
};

/**
 * The prototype's sticky filter sidebar as a plain GET form: every control is a
 * named input, so the URL carries the state and the page renders on the server.
 * The same component is used inside the mobile <details> panel (unlike the
 * prototype, where the mobile panel only applied the type filter).
 */
export function FilterPanel({ filter, cities, amenities, idPrefix }: Props) {
  const active = countActiveFilters(filter);
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <form method="get" action="/properties" className="space-y-6">
      {/* Keep sort/view when filters change; reset page. */}
      {filter.sort !== "relevance" ? <input type="hidden" name="sort" value={filter.sort} /> : null}
      {filter.view !== "grid" ? <input type="hidden" name="view" value={filter.view} /> : null}

      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="text-primary h-4 w-4" aria-hidden /> Filters
          {active > 0 ? (
            <span className="rounded-pill bg-primary px-2 py-0.5 text-xs text-white">{active}</span>
          ) : null}
        </h2>
        {active > 0 ? (
          <Link href="/properties" className="text-primary text-xs font-medium hover:underline">
            Clear all
          </Link>
        ) : null}
      </div>

      <Section title="Location">
        <label htmlFor={id("q")} className="sr-only">
          Area or landmark
        </label>
        <input
          id={id("q")}
          name="q"
          defaultValue={filter.q}
          placeholder="Area, landmark or keyword"
          className={input}
        />
        <label htmlFor={id("city")} className="sr-only">
          City
        </label>
        <select id={id("city")} name="city" defaultValue={filter.city} className={input}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Monthly rent (₹)">
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={id("min")}>
            Minimum rent
          </label>
          <input
            id={id("min")}
            name="minRent"
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            placeholder="Min"
            defaultValue={filter.minRent ?? ""}
            className={input}
          />
          <label className="sr-only" htmlFor={id("max")}>
            Maximum rent
          </label>
          <input
            id={id("max")}
            name="maxRent"
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            placeholder="Max"
            defaultValue={filter.maxRent ?? ""}
            className={input}
          />
        </div>
      </Section>

      <Section title="Property type">
        <CheckList
          idPrefix={idPrefix}
          name="type"
          options={Object.entries(propertyTypeShortLabels)}
          selected={filter.type}
        />
      </Section>

      <Section title="Amenities">
        <CheckList
          idPrefix={idPrefix}
          name="amenities"
          options={amenities.map((a) => [a.slug, a.label] as const)}
          selected={filter.amenities}
        />
      </Section>

      <Section title="Furnishing">
        <CheckList
          idPrefix={idPrefix}
          name="furnishing"
          options={Object.entries(furnishingLabels)}
          selected={filter.furnishing}
        />
      </Section>

      <Section title="Suitable for">
        <div className="space-y-1.5">
          {Object.entries(genderPreferenceLabels).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value={value}
                defaultChecked={filter.gender === value}
                className="accent-primary h-4 w-4"
              />
              {value === "any" ? "Anyone" : label.replace(" only", "")}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Rating">
        <div className="space-y-1.5">
          {[4, 3].map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="minRating"
                value={r}
                defaultChecked={filter.minRating === r}
                className="accent-primary h-4 w-4"
              />
              {r}+ ★
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="minRating"
              value=""
              defaultChecked={!filter.minRating}
              className="accent-primary h-4 w-4"
            />
            Any rating
          </label>
        </div>
      </Section>

      <button
        type="submit"
        className="rounded-pill bg-primary hover:bg-primary-dark w-full px-4 py-2.5 text-sm font-semibold text-white transition"
      >
        Apply Filters
      </button>
    </form>
  );
}

const input =
  "w-full rounded-card-sm border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-border/60 space-y-2 border-b pb-5 last:border-b-0">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckList({
  idPrefix,
  name,
  options,
  selected,
}: {
  idPrefix: string;
  name: string;
  options: ReadonlyArray<readonly [string, string]>;
  selected: readonly string[];
}) {
  return (
    <ul className="grid grid-cols-1 gap-1.5">
      {options.map(([value, label]) => (
        <li key={`${idPrefix}-${name}-${value}`}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={value}
              defaultChecked={selected.includes(value)}
              className="accent-primary h-4 w-4"
            />
            {label}
          </label>
        </li>
      ))}
    </ul>
  );
}
