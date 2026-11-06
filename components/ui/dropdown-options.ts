export type DropdownOption = {
  value: string;
  label: string;
  /** Optional second line, e.g. the state under a city. */
  description?: string;
};

/**
 * Suggestions for free text: label prefix matches first, then label matches anywhere,
 * then description matches, so typing "Bang" shows Bangalore before its localities.
 */
export function filterOptions(
  options: readonly DropdownOption[],
  query: string,
  limit = 8,
): DropdownOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);

  const rank = ({ label, description }: DropdownOption) => {
    const name = label.toLowerCase();
    if (name.startsWith(q)) return 0;
    if (name.includes(q)) return 1;
    return description?.toLowerCase().includes(q) ? 2 : 3;
  };

  return options
    .map((option) => ({ option, score: rank(option) }))
    .filter(({ score }) => score < 3)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ option }) => option);
}

/** Index of the first option whose label starts with the typed text, or -1. */
export function findTypeaheadIndex(options: readonly DropdownOption[], typed: string): number {
  const q = typed.toLowerCase();
  return options.findIndex((option) => option.label.toLowerCase().startsWith(q));
}
