import { Calendar, Dumbbell } from "lucide-react";
import type { WorkoutSet, Exercise } from "@/types";

interface HistoryViewProps {
  exercises: Exercise[];
  allSets: WorkoutSet[];
}

interface DayGroup {
  date: string;
  exercises: {
    exercise: Exercise | undefined;
    sets: WorkoutSet[];
  }[];
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

export function HistoryView({ exercises, allSets }: HistoryViewProps) {
  if (allSets.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
        <h2 className="text-lg font-semibold text-zinc-300">
          История пуста
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Сохраните первую тренировку, и она появится здесь
        </p>
      </div>
    );
  }

  // Group sets by date
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const byDate = new Map<string, WorkoutSet[]>();
  for (const set of allSets) {
    const arr = byDate.get(set.workout_date) ?? [];
    arr.push(set);
    byDate.set(set.workout_date, arr);
  }

  const days: DayGroup[] = Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sets]) => {
      // Group sets within a day by exercise
      const byExercise = new Map<string, WorkoutSet[]>();
      for (const s of sets.sort((a, b) => a.set_order - b.set_order)) {
        const arr = byExercise.get(s.exercise_id) ?? [];
        arr.push(s);
        byExercise.set(s.exercise_id, arr);
      }
      return {
        date,
        exercises: Array.from(byExercise.entries()).map(([exId, exSets]) => ({
          exercise: exerciseMap.get(exId),
          sets: exSets,
        })),
      };
    });

  // Calculate total volume for a day
  const dayVolume = (sets: WorkoutSet[]) =>
    sets.reduce((sum, s) => sum + Number(s.weight_kg) * s.reps, 0);

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const totalSets = day.exercises.reduce((sum, e) => sum + e.sets.length, 0);
        const totalVol = day.exercises.reduce(
          (sum, e) => sum + dayVolume(e.sets),
          0
        );
        const today = isToday(day.date);

        return (
          <div
            key={day.date}
            className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80"
          >
            {/* Day header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-800/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-semibold capitalize text-white">
                  {formatDateLong(day.date)}
                </span>
                {today && (
                  <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-400">
                    Сегодня
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500">
                {formatDateShort(day.date)}
              </span>
            </div>

            {/* Stats bar */}
            <div className="flex gap-4 border-b border-zinc-800/50 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-xs text-zinc-400">
                  {day.exercises.length} упр. · {totalSets} под.
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Объём:{" "}
                <span className="font-medium text-zinc-300">
                  {Math.round(totalVol).toLocaleString("ru-RU")} кг
                </span>
              </div>
            </div>

            {/* Exercises */}
            <div className="divide-y divide-zinc-800/50">
              {day.exercises.map(({ exercise, sets }) => (
                <div key={exercise?.id ?? sets[0]?.id} className="px-4 py-3">
                  <h4 className="mb-2 text-sm font-medium text-white">
                    {exercise?.name ?? "Удалённое упражнение"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sets.map((s, i) => (
                      <span
                        key={s.id}
                        className="rounded-lg bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300"
                      >
                        <span className="text-teal-400">{i + 1}</span>{" "}
                        {s.weight_kg} кг × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
