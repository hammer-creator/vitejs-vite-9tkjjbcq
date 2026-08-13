export interface Exercise {
  id: string;
  name: string;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  workout_date: string;
  set_order: number;
  created_at: string;
}

export interface ExerciseWithLastWorkout {
  exercise: Exercise;
  lastSets: WorkoutSet[];
  lastDate: string | null;
}

export interface SetInput {
  weight_kg: string;
  reps: string;
  completed?: boolean;
}
