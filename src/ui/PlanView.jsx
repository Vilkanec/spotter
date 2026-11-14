"use client";

import { useRouter } from "next/navigation";
import { exerciseName } from "@/core/exercises";
import { WEEKDAY_LABELS } from "@/core/labels";
import { dayDurationMinutes } from "@/core/plan";
import { isDayDone, isExerciseDone } from "@/core/progress";
import { sendJson } from "./api";
import { ExerciseImage } from "./ExerciseImage";

export function PlanView({ overview }) {
  const router = useRouter();
  const { plan, completions, source, warnings } = overview;

  async function setDone(day, exerciseId, done) {
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
                <h2>{WEEKDAY_LABELS[day.day]}</h2>
                <p className="muted small">{dayDurationMinutes(day)} min. su apšilimu</p>
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
                  <ExerciseImage exerciseId={planned.exerciseId} name={exerciseName(planned.exerciseId)} />
                  <span className="exercise-name">{exerciseName(planned.exerciseId)}</span>
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
