import { useCallback, useEffect, useRef, useState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { AddExerciseForm } from "@/components/AddExerciseForm";
import { HistoryView } from "@/components/HistoryView";
import { TabSwitcher, type TabId } from "@/components/TabSwitcher";
import { DaySelector } from "@/components/DaySelector";
import { RestTimer, type RestTimerHandle } from "@/components/RestTimer";
import { TechniqueModal } from "@/components/TechniqueModal";
import { useExercises } from "@/hooks/useExercises";
import {
  getExercisesForDay,
  setExercisesForDay,
  addExerciseToDay,
  removeExerciseFromDay,
  hasBeenSeeded,
  markSeeded,
  getCurrentDayIndex,
  type DayIndex,
} from "@/lib/daySplit";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_NAMES_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

function App() {
  const {
    exercises,
    allSets,
    lastWorkouts,
    loading,
    error,
    addExercise,
    saveWorkout,
    renameExercise,
  } = useExercises();

  const [activeTab, setActiveTab] = useState<TabId>("current");
  const [activeDay, setActiveDay] = useState<DayIndex>(getCurrentDayIndex());
  const [dayAssignments, setDayAssignments] = useState<Record<string, string[]>>(
    {}
  );
  const [techniqueExercise, setTechniqueExercise] = useState<string | null>(
    null
  );
  const timerHandleRef = useRef<RestTimerHandle | null>(null);

  const registerTimerHandle = useCallback((handle: RestTimerHandle) => {
    timerHandleRef.current = handle;
  }, []);

  const triggerRestTimer = useCallback(() => {
    timerHandleRef.current?.start();
  }, []);

  // Load day assignments from LocalStorage on mount
  useEffect(() => {
    const split: Record<string, string[]> = {};
    for (let i = 0; i < 7; i++) {
      split[String(i)] = getExercisesForDay(i as DayIndex);
    }
    setDayAssignments(split);
  }, []);

  // Seed default day split once: assign existing exercises to days
  useEffect(() => {
    if (loading || exercises.length === 0 || hasBeenSeeded()) return;

    // Default seed: spread exercises across days
    // First two exercises → Monday, third → Wednesday, etc.
    const seed: Record<string, string[]> = {
      "0": [],
      "1": [],
      "2": [],
      "3": [],
      "4": [],
      "5": [],
      "6": [],
    };
    exercises.forEach((ex, i) => {
      if (i < 2) seed["0"].push(ex.id); // Mon
      else if (i === 2) seed["2"].push(ex.id); // Wed
      else if (i === 3) seed["4"].push(ex.id); // Fri
      else seed[String(i % 7)].push(ex.id);
    });

    for (let d = 0; d < 7; d++) {
      setExercisesForDay(d as DayIndex, seed[String(d)]);
    }
    markSeeded();
    setDayAssignments(seed);
  }, [loading, exercises]);

  const refreshDayAssignments = useCallback(() => {
    const split: Record<string, string[]> = {};
    for (let i = 0; i < 7; i++) {
      split[String(i)] = getExercisesForDay(i as DayIndex);
    }
    setDayAssignments(split);
  }, []);

  const handleAddNewToDay = useCallback(
    async (name: string) => {
      const ex = await addExercise(name);
      addExerciseToDay(activeDay, ex.id);
      refreshDayAssignments();
    },
    [addExercise, activeDay, refreshDayAssignments]
  );

  const handleAddExistingToDay = useCallback(
    async (exerciseId: string) => {
      addExerciseToDay(activeDay, exerciseId);
      refreshDayAssignments();
    },
    [activeDay, refreshDayAssignments]
  );

  const handleRemoveFromDay = useCallback(
    (exerciseId: string) => {
      removeExerciseFromDay(activeDay, exerciseId);
      refreshDayAssignments();
    },
    [activeDay, refreshDayAssignments]
  );

  // Exercises assigned to the active day
  const dayExerciseIds = dayAssignments[String(activeDay)] ?? [];
  const dayExercises = dayExerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  // Exercises not assigned to any day (available to pick from)
  const allAssignedIds = new Set(
    Object.values(dayAssignments).flat()
  );
  const availableExercises = exercises.filter(
    (e) => !allAssignedIds.has(e.id)
  );

  // Count unique workout dates for the history badge
  const uniqueDates = new Set(allSets.map((s) => s.workout_date));
  const historyCount = uniqueDates.size;

  const todayIndex = getCurrentDayIndex();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-zinc-900/40 via-transparent to-zinc-950" />
      <div className="pointer-events-none fixed left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[120px]" />

      <div className="relative mx-auto max-w-2xl px-3 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="mb-5 text-center">
          <div className="mb-2.5 inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30 sm:h-12 sm:w-12">
              <Dumbbell className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Мой Воркаут
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Дневник тренировок — записывай подходы, отслеживай прогресс
          </p>
        </header>

        {/* Tab switcher */}
        <TabSwitcher
          active={activeTab}
          onChange={setActiveTab}
          historyCount={historyCount}
        />

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="mt-3 text-sm">Загрузка...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-800/50 bg-red-500/10 p-6 text-center">
            <p className="text-sm text-red-400">
              Не удалось загрузить данные: {error}
            </p>
          </div>
        ) : activeTab === "current" ? (
          <>
            {/* Day selector */}
            <DaySelector
              days={DAY_NAMES}
              activeDay={activeDay}
              todayIndex={todayIndex}
              onSelect={(d) => setActiveDay(d as DayIndex)}
            />

            {/* Day label */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {DAY_NAMES_FULL[activeDay]}
              </h2>
              <span className="text-xs text-zinc-500">
                {dayExercises.length > 0
                  ? `${dayExercises.length} упр.`
                  : "Нет упражнений"}
              </span>
            </div>

            {/* Exercise cards for this day */}
            {dayExercises.length === 0 ? (
              <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                <Dumbbell className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                <h2 className="text-base font-semibold text-zinc-300">
                  На этот день нет упражнений
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Добавьте упражнение, чтобы начать тренировку
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dayExercises.map((ex) => {
                  const last = lastWorkouts[ex.id];
                  return (
                    <ExerciseCard
                      key={ex.id}
                      exerciseId={ex.id}
                      exerciseName={ex.name}
                      lastSets={last?.sets ?? []}
                      lastDate={last?.date ?? null}
                      onSave={saveWorkout}
                      onRemoveFromDay={handleRemoveFromDay}
                      onRename={renameExercise}
                      onShowTechnique={setTechniqueExercise}
                      onSetCompleted={triggerRestTimer}
                    />
                  );
                })}
              </div>
            )}

            {/* Add exercise */}
            <div className="mt-6">
              <AddExerciseForm
                onAddNew={handleAddNewToDay}
                onAddExisting={handleAddExistingToDay}
                availableExercises={availableExercises}
                dayLabel={DAY_NAMES_FULL[activeDay]}
              />
            </div>
          </>
        ) : (
          <HistoryView exercises={exercises} allSets={allSets} />
        )}

        {/* Footer */}
        <footer className="mt-10 pb-20 text-center text-xs text-zinc-600">
          Данные сохраняются автоматически и появятся на следующей тренировке
        </footer>
      </div>

      {/* Rest timer — always mounted, floats at bottom */}
      <RestTimer registerHandle={registerTimerHandle} />

      {/* Technique modal */}
      {techniqueExercise && (
        <TechniqueModal
          exerciseName={techniqueExercise}
          onClose={() => setTechniqueExercise(null)}
        />
      )}
    </div>
  );
}

export default App;
