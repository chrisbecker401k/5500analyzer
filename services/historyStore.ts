import type { PlanAnalysis } from "@/types/plan";

const HISTORY_KEY = "5500-analyzer-generated-history";
const ARCHIVED_KEY = "5500-analyzer-archived-history";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getGeneratedHistory() {
  return readJson<PlanAnalysis[]>(HISTORY_KEY, []);
}

export function saveGeneratedHistory(analysis: PlanAnalysis) {
  const current = getGeneratedHistory();
  const next = [analysis, ...current.filter((item) => item.id !== analysis.id)].slice(0, 50);
  writeJson(HISTORY_KEY, next);
  return next;
}

export function getArchivedHistoryIds() {
  return readJson<string[]>(ARCHIVED_KEY, []);
}

export function saveArchivedHistoryIds(ids: string[]) {
  writeJson(ARCHIVED_KEY, ids);
}
