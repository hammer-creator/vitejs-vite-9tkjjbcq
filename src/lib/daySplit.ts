export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Mon, 6=Sun

const STORAGE_KEY = "workout_diary_day_split";
const SEED_FLAG_KEY = "workout_diary_day_split_seeded";

type DaySplit = Record<string, string[]>;

function read(): DaySplit {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DaySplit;
  } catch {
    return {};
  }
}

function write(data: DaySplit) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function getDaySplit(): DaySplit {
  return read();
}

export function getExercisesForDay(day: DayIndex): string[] {
  return read()[String(day)] ?? [];
}

export function setExercisesForDay(day: DayIndex, exerciseIds: string[]) {
  const all = read();
  all[String(day)] = exerciseIds;
  write(all);
}

export function addExerciseToDay(day: DayIndex, exerciseId: string) {
  const all = read();
  const key = String(day);
  const list = all[key] ?? [];
  if (!list.includes(exerciseId)) {
    list.push(exerciseId);
  }
  all[key] = list;
  write(all);
}

export function removeExerciseFromDay(day: DayIndex, exerciseId: string) {
  const all = read();
  const key = String(day);
  all[key] = (all[key] ?? []).filter((id) => id !== exerciseId);
  write(all);
}

export function hasBeenSeeded(): boolean {
  return localStorage.getItem(SEED_FLAG_KEY) === "true";
}

export function markSeeded() {
  localStorage.setItem(SEED_FLAG_KEY, "true");
}

export function getCurrentDayIndex(): DayIndex {
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // Our system:   0=Mon, 1=Tue, ..., 6=Sun
  return ((new Date().getDay() + 6) % 7) as DayIndex;
}
