import { PlanGenerator } from "@/core/PlanGenerator";
import { PlanService } from "@/services/PlanService";
import { TenantStore } from "@/storage/TenantStore";

export class ScriptedAiClient {
  calls = 0;
  #answers;

  constructor(answers) {
    this.#answers = answers;
  }

  async generateJson() {
    const answer = this.#answers[this.calls++];
    if (answer instanceof Error) throw answer;
    return answer;
  }
}

export function exercises(ids, sets = 3, reps = 10) {
  return ids.map((exerciseId) => ({ exerciseId, sets, reps }));
}

export function plan(exercisesByDay) {
  return {
    days: Object.entries(exercisesByDay).map(([day, dayExercises]) => ({ day, exercises: dayExercises })),
  };
}

export function planServiceFor(database, tenantId) {
  return new PlanService(new TenantStore(database, tenantId), new PlanGenerator(new ScriptedAiClient([])));
}
