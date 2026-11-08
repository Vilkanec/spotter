"use client";

import { useRouter } from "next/navigation";
import { ExerciseCatalog, type Exercise } from "@/domain/exercise";
import type { PlanDay } from "@/domain/plan";
import { weekdayLabel } from "@/domain/profile";
import { isDayDone, isExerciseDone } from "@/domain/progress";
import { dayDurationMinutes } from "@/planning/rules/DurationRule";
import type { PlanOverview } from "@/services/PlanService";
import { sendJson } from "./api";
import { ExerciseImage } from "./ExerciseImage";

export function PlanView({ overview, exercises }: { overview: PlanOverview; exercises: Exercise[] }) {
  const router = useRouter();
  const catalog = new ExerciseCatalog(exercises);
  const { plan, completions, source, warnings } = overview;

  const nameOf = (exerciseId: string) => catalog.find(exerciseId)?.name ?? exerciseId;

  async function setDone(day: PlanDay, exerciseId: string | null, done: boolean) {
    await sendJson("/api/plan/completions", "PUT", { day: day.day, exerciseId, done });
    router.refresh();
  }

  return (
    <div className="stack">
      <section>
        <p className="progress-count">
          {overview.completedDays} iš {plan.days.length}
        </p>
        <p className="muted">treniruočių atlikta šią savaitę</p>
        <div className="progress-bar" aria-hidden="true">
          {plan.days.map((day) => (
            <span key={day.day} className="progress-segment" data-done={isDayDone(completions, day)} />
          ))}
        </div>
      </section>

      {source === "simplified" && (
        <p className="notice">AI planas du kartus nepraėjo patikros, todėl Spotter sudarė paprastesnį viso kūno planą.</p>
      )}
      {warnings.length > 0 && (
        <div className="notice notice-warning" role="status">
          Planas išsaugotas su įspėjimais:
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        {plan.days.map((day) => (
          <section key={day.day} className="day">
            <div className="day-header">
              <div>
                <h2>{weekdayLabel(day.day)}</h2>
                <p className="muted small">{dayDurationMinutes(day, catalog)} min. su apšilimu</p>
              </div>
              <button className="button" type="button" onClick={() => setDone(day, null, !isDayDone(completions, day))}>
                {isDayDone(completions, day) ? "Atšaukti" : "Pažymėti dieną"}
              </button>
            </div>
            {day.exercises.map((planned) => {
              const done = isExerciseDone(completions, day.day, planned.exerciseId);
              return (
                <label key={planned.exerciseId} className="exercise" data-done={done}>
                  <input type="checkbox" checked={done} onChange={() => setDone(day, planned.exerciseId, !done)} />
                  <ExerciseImage exerciseId={planned.exerciseId} name={nameOf(planned.exerciseId)} />
                  <span className="exercise-name">{nameOf(planned.exerciseId)}</span>
                  <span className="volume">
                    {planned.sets} × {planned.reps}
                  </span>
                </label>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
