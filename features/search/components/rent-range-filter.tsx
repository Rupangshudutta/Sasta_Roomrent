"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";

type Preset = { label: string; min?: number; max?: number };

const presets: readonly Preset[] = [
  { label: "< ₹5K", max: 5000 },
  { label: "₹5K – ₹10K", min: 5000, max: 10000 },
  { label: "₹10K – ₹15K", min: 10000, max: 15000 },
  { label: "₹15K+", min: 15000 },
];

type Props = {
  idPrefix: string;
  minRent?: number;
  maxRent?: number;
};

const numberInput =
  "w-full rounded-card-sm border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const chip =
  "rounded-pill border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

/**
 * Quick-select rent chips. Still part of the GET filter form: the chosen range is
 * submitted as the same `minRent` / `maxRent` params the number inputs used to send,
 * so URLs and the server-side schema are unchanged. "Custom Range" reveals the inputs.
 */
export function RentRangeFilter({ idPrefix, minRent, maxRent }: Props) {
  const initialPreset = presets.findIndex((p) => p.min === minRent && p.max === maxRent);
  const hasValue = minRent !== undefined || maxRent !== undefined;

  // "custom" when the URL carries a range that matches no preset; null = no rent filter.
  const [selected, setSelected] = useState<number | "custom" | null>(
    initialPreset >= 0 ? initialPreset : hasValue ? "custom" : null,
  );
  const [min, setMin] = useState(minRent?.toString() ?? "");
  const [max, setMax] = useState(maxRent?.toString() ?? "");

  const choose = (next: number | "custom") => {
    if (selected === next) {
      setSelected(null); // click again to clear
      return;
    }
    setSelected(next);
    if (next !== "custom") {
      setMin("");
      setMax("");
    }
  };

  const preset = typeof selected === "number" ? presets[selected] : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={selected === i}
            onClick={() => choose(i)}
            className={cn(
              chip,
              selected === i
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-primary/30 text-foreground hover:bg-primary/5 bg-white",
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={selected === "custom"}
          onClick={() => choose("custom")}
          className={cn(
            chip,
            "inline-flex items-center gap-1.5",
            selected === "custom"
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/30 text-primary hover:bg-primary/5 bg-white",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Custom Range
        </button>
      </div>

      {preset ? (
        <>
          {preset.min !== undefined ? (
            <input type="hidden" name="minRent" value={preset.min} />
          ) : null}
          {preset.max !== undefined ? (
            <input type="hidden" name="maxRent" value={preset.max} />
          ) : null}
        </>
      ) : null}

      {selected === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-min`}>
            Minimum rent
          </label>
          <input
            id={`${idPrefix}-min`}
            name="minRent"
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className={numberInput}
          />
          <label className="sr-only" htmlFor={`${idPrefix}-max`}>
            Maximum rent
          </label>
          <input
            id={`${idPrefix}-max`}
            name="maxRent"
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className={numberInput}
          />
        </div>
      ) : null}
    </div>
  );
}
