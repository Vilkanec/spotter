import type { Equipment, Level, Pain } from "./profile";

export const MUSCLE_GROUPS = ["chest", "back", "shoulders", "arms", "legs", "core"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "krūtinė",
  back: "nugara",
  shoulders: "pečiai",
  arms: "rankos",
  legs: "kojos",
  core: "pilvo presas",
};

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment[];
  complexity: Level;
  unsuitableFor: Pain[];
  minutesPerSet: number;
}

export class ExerciseCatalog {
  private readonly byId: Map<string, Exercise>;

  constructor(readonly exercises: readonly Exercise[]) {
    this.byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }

  find(id: string): Exercise | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }
}
