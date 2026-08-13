import { useState } from "react";
import {
  Dumbbell,
  Plus,
  Trash2,
  Save,
  X,
  Check,
  Pencil,
  Calendar,
  Info,
  CheckCircle,
  Circle,
} from "lucide-react";
import type { WorkoutSet, SetInput } from "@/types";
import { getCachedWorkout, cacheWorkout } from "@/lib/storage";

interface ExerciseCardProps {
  exerciseId: string;
  exerciseName: string;
  lastSets: WorkoutSet[];
  lastDate: string | null;
  onSave: (
    exerciseId: string,
    sets: { weight_kg: number; reps: number }[],
    date: string
  ) => Promise<void>;
  onRemoveFromDay: (exerciseId: string) => void;
  onRename: (exerciseId: string, name: string) => Promise<void>;
  onShowTechnique: (name: string) => void;
  onSetCompleted: () => void;
}

export function ExerciseCard({
  exerciseId,
  exerciseName,
  lastSets,
  lastDate,
  onSave,
  onRemoveFromDay,
  onRename,
  onShowTechnique,
  onSetCompleted,
}: ExerciseCardProps) {
  const buildInitialSets = (): SetInput[] => {
    // Priority 1: LocalStorage cache (fast prefill on page load)
    const cached = getCachedWorkout(exerciseId);
    if (cached && cached.sets.length > 0) {
      return cached.sets.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps }));
    }
    // Priority 2: last workout from database
    if (lastSets.length > 0) {
      return lastSets.map((s) => ({
        weight_kg: String(s.weight_kg),
        reps: String(s.reps),
      }));
    }
    return [{ weight_kg: "", reps: "" }];
  };

  const [sets, setSets] = useState<SetInput[]>(buildInitialSets);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(exerciseName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [workoutDate, setWorkoutDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState<string | null>(null);

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([
      ...sets,
      { weight_kg: last?.weight_kg ?? "", reps: last?.reps ?? "" },
    ]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (
    index: number,
    field: keyof SetInput,
    value: string
  ) => {
    setSets(
      sets.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const toggleCompleted = (index: number) => {
    setSets(
      sets.map((s, i) =>
        i === index ? { ...s, completed: !s.completed } : s
      )
    );
    // Auto-start rest timer when marking a set as done
    if (!sets[index].completed) {
      onSetCompleted();
    }
  };

  const handleSave = async () => {
    setError(null);
    const validSets = sets.filter((s) => s.weight_kg && s.reps);
    if (validSets.length === 0) {
      setError("Добавьте хотя бы один подход с весом и повторениями");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        exerciseId,
        validSets.map((s) => ({
          weight_kg: parseFloat(s.weight_kg),
          reps: parseInt(s.reps, 10),
        })),
        workoutDate
      );
      // Cache to LocalStorage for instant prefill next time
      cacheWorkout(
        exerciseId,
        validSets.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps })),
        workoutDate
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Start rest timer after save
      onSetCompleted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при сохранении"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async () => {
    if (!nameValue.trim()) return;
    try {
      await onRename(exerciseId, nameValue.trim());
      setEditingName(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при переименовании"
      );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const lastDateText = formatDate(lastDate);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg transition-all duration-300 hover:border-zinc-700 hover:shadow-xl sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Dumbbell className="h-5 w-5 flex-shrink-0 text-teal-400" />
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-base font-semibold text-white outline-none focus:border-teal-500 sm:text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setNameValue(exerciseName);
                  }
                }}
              />
              <button
                onClick={handleRename}
                className="rounded-lg bg-teal-500 p-2 text-white transition hover:bg-teal-400"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameValue(exerciseName);
                }}
                className="rounded-lg bg-zinc-700 p-2 text-zinc-300 transition hover:bg-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="truncate text-base font-semibold text-white sm:text-lg">
                {exerciseName}
              </h3>
              <button
                onClick={() => onShowTechnique(exerciseName)}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-zinc-600 text-zinc-500 transition hover:border-teal-500 hover:text-teal-400"
                title="Техника выполнения"
              >
                <Info className="h-3 w-3" />
              </button>
              <button
                onClick={() => setEditingName(true)}
                className="flex-shrink-0 rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                title="Переименовать"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {confirmDelete ? (
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="text-xs text-red-400">Убрать?</span>
            <button
              onClick={() => onRemoveFromDay(exerciseId)}
              className="rounded-lg bg-red-500 p-2 text-white transition hover:bg-red-400"
              title="Подтвердить"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg bg-zinc-700 p-2 text-zinc-300 transition hover:bg-zinc-600"
              title="Отмена"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-shrink-0 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
            title="Убрать из этого дня"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Last workout info */}
      {lastSets.length > 0 && lastDateText && (
        <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2">
          <p className="text-xs text-zinc-500">
            Прошлый раз: {lastDateText}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {lastSets.map((s, i) => (
              <span
                key={s.id}
                className="rounded-md bg-zinc-700/60 px-2 py-1 text-xs text-zinc-300"
              >
                {i + 1}: {s.weight_kg} кг × {s.reps}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Date picker */}
      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <Calendar className="h-3.5 w-3.5" />
          Дата тренировки
        </label>
        <input
          type="date"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        />
      </div>

      {/* Sets */}
      <div className="space-y-2">
        {sets.map((set, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2.5 transition sm:gap-3 sm:px-3 ${
              set.completed
                ? "border-teal-700/50 bg-teal-900/15"
                : "border-zinc-800 bg-zinc-800/40 hover:border-zinc-700"
            }`}
          >
            <button
              onClick={() => toggleCompleted(i)}
              className="flex-shrink-0 transition"
              title={set.completed ? "Выполнен" : "Отметить выполненным"}
            >
              {set.completed ? (
                <CheckCircle className="h-6 w-6 text-teal-400" />
              ) : (
                <Circle className="h-6 w-6 text-zinc-600 hover:text-zinc-400" />
              )}
            </button>
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                set.completed
                  ? "bg-teal-500/20 text-teal-400"
                  : "bg-teal-500/15 text-teal-400"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex flex-1 items-center gap-1.5 sm:gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="кг"
                  value={set.weight_kg}
                  onChange={(e) => updateSet(i, "weight_kg", e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-1.5 py-2 text-center text-sm text-white outline-none focus:border-teal-500 sm:px-2.5 sm:text-base"
                />
              </div>
              <span className="text-xs text-zinc-600">×</span>
              <div className="flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="повт"
                  value={set.reps}
                  onChange={(e) => updateSet(i, "reps", e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-1.5 py-2 text-center text-sm text-white outline-none focus:border-teal-500 sm:px-2.5 sm:text-base"
                />
              </div>
            </div>
            {sets.length > 1 && (
              <button
                onClick={() => removeSet(i)}
                className="flex-shrink-0 rounded-md p-1 text-zinc-600 transition hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={addSet}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-teal-600 hover:text-teal-400"
        >
          <Plus className="h-4 w-4" />
          Добавить подход
        </button>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Сохранено!
            </>
          ) : saving ? (
            "Сохранение..."
          ) : (
            <>
              <Save className="h-4 w-4" />
              Сохранить тренировку
            </>
          )}
        </button>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
