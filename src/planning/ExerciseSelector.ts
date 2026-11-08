import type { Exercise } from "@/domain/exercise";
import type { Profile } from "@/domain/profile";

export class ExerciseSelector {
  select(profile: Profile, exercises: readonly Exercise[]): Exercise[] {
    return exercises.filter(
      (exercise) =>
        exercise.complexity <= profile.level &&
        exercise.equipment.every((item) => profile.equipment.includes(item)) &&
        !exercise.unsuitableFor.some((pain) => profile.pains.includes(pain)),
    );
  }
}
