/*
# Workout Diary — Exercises and Workout Sets

## Summary
Creates a single-tenant workout diary schema. No authentication is required,
so all data is shared/public and accessible via the anon key.

## Tables

### exercises
- `id` (uuid, primary key)
- `name` (text, not null) — exercise name, e.g. "Bench Press"
- `created_at` (timestamptz) — when the exercise was created

### workout_sets
- `id` (uuid, primary key)
- `exercise_id` (uuid, foreign key → exercises.id ON DELETE CASCADE)
- `weight_kg` (numeric, not null) — weight used in this set
- `reps` (integer, not null) — number of repetitions
- `workout_date` (date, not null, default today) — which workout day this set belongs to
- `set_order` (integer, not null, default 1) — order within that exercise on that date
- `created_at` (timestamptz)

## Security
- RLS enabled on both tables.
- All CRUD operations allowed for anon + authenticated (single-tenant, no auth).

## Notes
1. Each workout session is identified by `workout_date`.
2. The latest workout for each exercise (max workout_date) is used to prefill the next session.
3. `set_order` preserves the order of sets within an exercise on a given day.
*/

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exercises" ON exercises;
CREATE POLICY "anon_select_exercises" ON exercises FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exercises" ON exercises;
CREATE POLICY "anon_insert_exercises" ON exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exercises" ON exercises;
CREATE POLICY "anon_update_exercises" ON exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_exercises" ON exercises;
CREATE POLICY "anon_delete_exercises" ON exercises FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  reps integer NOT NULL,
  workout_date date NOT NULL DEFAULT CURRENT_DATE,
  set_order integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sets" ON workout_sets;
CREATE POLICY "anon_select_sets" ON workout_sets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sets" ON workout_sets;
CREATE POLICY "anon_insert_sets" ON workout_sets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sets" ON workout_sets;
CREATE POLICY "anon_update_sets" ON workout_sets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sets" ON workout_sets;
CREATE POLICY "anon_delete_sets" ON workout_sets FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_date
  ON workout_sets(exercise_id, workout_date, set_order);