import { useState } from "react";
import { Plus, X, Search, Dumbbell, Check } from "lucide-react";
import type { Exercise } from "@/types";

interface AddExerciseFormProps {
  onAddNew: (name: string) => Promise<unknown>;
  onAddExisting: (exerciseId: string) => Promise<unknown>;
  availableExercises: Exercise[];
  dayLabel: string;
}

type Mode = "menu" | "pick" | "custom";

export function AddExerciseForm({
  onAddNew,
  onAddExisting,
  availableExercises,
  dayLabel,
}: AddExerciseFormProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode("menu");
    setName("");
    setSearch("");
    setError(null);
  };

  const handleAddNew = async () => {
    if (!name.trim()) {
      setError("Введите название упражнения");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAddNew(name.trim());
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при добавлении"
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePickExisting = async (exerciseId: string) => {
    setBusy(true);
    setError(null);
    try {
      await onAddExisting(exerciseId);
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при добавлении"
      );
    } finally {
      setBusy(false);
    }
  };

  const filtered = availableExercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- Collapsed: show the add button ---
  if (mode === "menu") {
    return (
      <button
        onClick={() => setMode("pick")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 py-4 text-sm font-medium text-zinc-400 transition hover:border-teal-600 hover:bg-zinc-900/70 hover:text-teal-400"
      >
        <Plus className="h-5 w-5" />
        Добавить упражнение
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Добавить упражнение
          </h3>
          <p className="text-xs text-zinc-500">в {dayLabel}</p>
        </div>
        <button
          onClick={reset}
          className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-800/60 p-1">
        <button
          onClick={() => setMode("pick")}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
            mode === "pick"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Из списка
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
            mode === "custom"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Свой вариант
        </button>
      </div>

      {/* Pick from list */}
      {mode === "pick" && (
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск упражнения..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-teal-500"
              autoFocus
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              {availableExercises.length === 0
                ? "Нет доступных упражнений. Создайте новое во вкладке «Свой вариант»."
                : "Ничего не найдено"}
            </p>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handlePickExisting(ex.id)}
                  disabled={busy}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-800/40 px-3 py-2.5 text-left transition hover:border-teal-700 hover:bg-zinc-800/70 disabled:opacity-50"
                >
                  <Dumbbell className="h-4 w-4 flex-shrink-0 text-teal-400" />
                  <span className="flex-1 text-sm text-white">{ex.name}</span>
                  <Plus className="h-4 w-4 text-zinc-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom name */}
      {mode === "custom" && (
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Жим штанги лежа"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-base text-white outline-none focus:border-teal-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNew();
              if (e.key === "Escape") reset();
            }}
          />
          <button
            onClick={handleAddNew}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:opacity-60"
          >
            {busy ? (
              "Добавление..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Создать и добавить
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
