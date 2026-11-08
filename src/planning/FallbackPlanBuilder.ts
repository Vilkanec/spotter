import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from "@/domain/exercise";
import { WARM_UP_MINUTES, type PlannedExercise, type WeeklyPlan } from "@/domain/plan";
import { nextWeekday, previousWeekday, sortWeekdays, type Profile, type Weekday } from "@/domain/profile";

const ALTERNATING_SPLITS: MuscleGroup[][] = [
  ["chest", "shoulders", "arms"],
  ["legs", "back", "core"],
];
const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;
const MAX_EXERCISES_PER_DAY = 6;

export class FallbackPlanBuilder {
  build(profile: Profile, eligible: readonly Exercise[]): WeeklyPlan {
    const focusByDay = this.assignMuscleFocus(profile.trainingDays);
    return {
      days: sortWeekdays(profile.trainingDays).map((day) => ({
        day,
        exercises: this.pickExercises(focusByDay.get(day) ?? [], eligible, profile.sessionMinutes - WARM_UP_MINUTES),
      })),
    };
  }

  private assignMuscleFocus(trainingDays: readonly Weekday[]): Map<Weekday, MuscleGroup[]> {
    const focus = new Map<Weekday, MuscleGroup[]>();
    const runStarts = trainingDays.filter((day) => !trainingDays.includes(previousWeekday(day)));

    for (const start of runStarts) {
      const run = this.consecutiveRunFrom(start, trainingDays);
      run.forEach((day, index) => {
        focus.set(day, run.length === 1 ? [...MUSCLE_GROUPS] : ALTERNATING_SPLITS[index % ALTERNATING_SPLITS.length]);
      });
    }
    return focus;
  }

  private consecutiveRunFrom(start: Weekday, trainingDays: readonly Weekday[]): Weekday[] {
    const run: Weekday[] = [];
    for (let day = start; trainingDays.includes(day) && !run.includes(day); day = nextWeekday(day)) {
      run.push(day);
    }
    return run;
  }

  private pickExercises(muscles: MuscleGroup[], eligible: readonly Exercise[], minutesBudget: number): PlannedExercise[] {
    const optionsByMuscle = muscles.map((muscle) => eligible.filter((exercise) => exercise.muscleGroup === muscle));
    const picked: PlannedExercise[] = [];
    let minutesLeft = minutesBudget;

    for (let round = 0; picked.length < MAX_EXERCISES_PER_DAY; round++) {
      const candidates = optionsByMuscle.flatMap((options) => (round < options.length ? [options[round]] : []));
      if (candidates.length === 0) break;

      for (const exercise of candidates) {
        const minutes = DEFAULT_SETS * exercise.minutesPerSet;
        if (picked.length < MAX_EXERCISES_PER_DAY && minutes <= minutesLeft) {
          picked.push({ exerciseId: exercise.id, sets: DEFAULT_SETS, reps: DEFAULT_REPS });
          minutesLeft -= minutes;
        }
      }
    }
    return picked;
  }
}
