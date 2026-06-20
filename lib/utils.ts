import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null, compact = false) {
  if (value === null) return "Not visible in filing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard"
  }).format(value);
}

export function formatNumber(value: number | null) {
  if (value === null) return "Not visible in filing";
  return new Intl.NumberFormat("en-US").format(value);
}

export function calculatePercent(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return (numerator / denominator) * 100;
}

export function labelMissingValue(value: unknown, fallback = "Not visible in filing") {
  return value === null || value === undefined || value === "" ? fallback : value;
}
