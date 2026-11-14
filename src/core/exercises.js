import { EXERCISE_CATALOG } from "./exerciseCatalog";

export const MUSCLE_GROUPS = ["chest", "back", "shoulders", "arms", "legs", "core"];

const exercisesById = new Map(EXERCISE_CATALOG.map((exercise) => [exercise.id, exercise]));

export function findExercise(id) {
  return exercisesById.get(id);
}

export function exerciseName(id) {
  return findExercise(id)?.name ?? id;
}

export function eligibleExercises(profile) {
  return EXERCISE_CATALOG.filter(
    (exercise) =>
      exercise.complexity <= profile.level &&
      exercise.equipment.every((item) => profile.equipment.includes(item)) &&
      !exercise.unsuitableFor.some((pain) => profile.pains.includes(pain)),
  );
}
