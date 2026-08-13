import type { SetInput } from "@/types";

const STORAGE_KEY = "workout_diary_last_sets";

export interface CachedWorkout {
  sets: SetInput[];
  date: string;
}

type CachedWorkouts = Record<string, CachedWorkout>;

export function getCachedWorkouts(): CachedWorkouts {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CachedWorkouts;
  } catch {
    return {};
  }
}

export function getCachedWorkout(exerciseId: string): CachedWorkout | null {
  const all = getCachedWorkouts();
  return all[exerciseId] ?? null;
}

export function cacheWorkout(exerciseId: string, sets: SetInput[], date: string) {
  const all = getCachedWorkouts();
  all[exerciseId] = { sets, date };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota errors
  }
}

export function clearCachedWorkout(exerciseId: string) {
  const all = getCachedWorkouts();
  delete all[exerciseId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
