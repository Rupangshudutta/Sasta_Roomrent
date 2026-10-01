import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes so later values win (e.g. `cn("p-2", props.className)`). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
