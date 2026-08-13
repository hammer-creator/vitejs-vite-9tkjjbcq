import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Exercise, WorkoutSet } from "@/types";

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allSets, setAllSets] = useState<WorkoutSet[]>([]);
  const [lastWorkouts, setLastWorkouts] = useState<
    Record<string, { sets: WorkoutSet[]; date: string | null }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: exData, error: exError } = await supabase
      .from("exercises")
      .select("*")
      .order("created_at", { ascending: true });

    if (exError) {
      setError(exError.message);
      setLoading(false);
      return;
    }

    const { data: setData, error: setError2 } = await supabase
      .from("workout_sets")
      .select("*")
      .order("workout_date", { ascending: false })
      .order("set_order", { ascending: true });

    if (setError2) {
      setError(setError2.message);
      setLoading(false);
      return;
    }

    const exercisesData = (exData ?? []) as Exercise[];
    const setsData = (setData ?? []) as WorkoutSet[];

    setExercises(exercisesData);
    setAllSets(setsData);

    const map: Record<string, { sets: WorkoutSet[]; date: string | null }> = {};
    for (const ex of exercisesData) {
      const exSets = setsData.filter((s) => s.exercise_id === ex.id);
      if (exSets.length > 0) {
        const lastDate = exSets[0].workout_date;
        const lastSets = exSets.filter((s) => s.workout_date === lastDate);
        map[ex.id] = { sets: lastSets, date: lastDate };
      } else {
        map[ex.id] = { sets: [], date: null };
      }
    }
    setLastWorkouts(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addExercise = useCallback(
    async (name: string) => {
      const { data, error: err } = await supabase
        .from("exercises")
        .insert({ name })
        .select()
        .single();
      if (err) throw err;
      await fetchAll();
      return data as Exercise;
    },
    [fetchAll]
  );

  const saveWorkout = useCallback(
    async (
      exerciseId: string,
      sets: { weight_kg: number; reps: number }[],
      date: string
    ) => {
      const rows = sets.map((s, i) => ({
        exercise_id: exerciseId,
        weight_kg: s.weight_kg,
        reps: s.reps,
        workout_date: date,
        set_order: i + 1,
      }));
      const { error: err } = await supabase.from("workout_sets").insert(rows);
      if (err) throw err;
      await fetchAll();
    },
    [fetchAll]
  );

  const deleteExercise = useCallback(
    async (exerciseId: string) => {
      const { error: err } = await supabase
        .from("exercises")
        .delete()
        .eq("id", exerciseId);
      if (err) throw err;
      await fetchAll();
    },
    [fetchAll]
  );

  const renameExercise = useCallback(
    async (exerciseId: string, name: string) => {
      const { error: err } = await supabase
        .from("exercises")
        .update({ name })
        .eq("id", exerciseId);
      if (err) throw err;
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    exercises,
    allSets,
    lastWorkouts,
    loading,
    error,
    addExercise,
    saveWorkout,
    deleteExercise,
    renameExercise,
    refresh: fetchAll,
  };
}
