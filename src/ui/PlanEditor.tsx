"use client";

import { useState, type FormEvent } from "react";
import { ExerciseCatalog, type Exercise } from "@/domain/exercise";
import type { PlannedExercise, WeeklyPlan } from "@/domain/plan";
import { weekdayLabel, type Weekday } from "@/domain/profile";
import type { GenerationResult } from "@/planning/PlanGenerator";
import { errorMessage, sendJson } from "./api";
import { ExerciseImage } from "./ExerciseImage";
import { ExercisePicker } from "./ExercisePicker";

interface PlanEditorProps {
  initialPlan: WeeklyPlan;
  exercises: Exercise[];
  onSave: (plan: WeeklyPlan) => Promise<void>;
  onCancel: () => void;
}

export function PlanEditor({ initialPlan, exercises, onSave, onCancel }: PlanEditorProps) {
  const catalog = new ExerciseCatalog(exercises);
  const nameOf = (exerciseId: string) => catalog.find(exerciseId)?.name ?? exerciseId;
  const [plan, setPlan] = useState<WeeklyPlan>(initialPlan);
  const [pickerDay, setPickerDay] = useState<Weekday | null>(null);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function updateDay(day: Weekday, change: (exercises: PlannedExercise[]) => PlannedExercise[]) {
    setPlan({
      days: plan.days.map((planDay) => (planDay.day === day ? { ...planDay, exercises: change(planDay.exercises) } : planDay)),
    });
  }

  function updateExercise(day: Weekday, exerciseId: string, change: Partial<PlannedExercise>) {
    updateDay(day, (dayExercises) =>
      dayExercises.map((planned) => (planned.exerciseId === exerciseId ? { ...planned, ...change } : planned)),
    );
  }

  async function askAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await sendJson<GenerationResult>("/api/plan/revise", "POST", { plan, instruction });
      if (result.status === "error") {
        setError(result.message);
      } else {
        setPlan(result.plan);
        setInstruction("");
        setNotice("AI pakeitė planą ir jis praėjo visas patikras. Peržiūrėk ir išsaugok.");
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await onSave({ days: plan.days.filter((day) => day.exercises.length > 0) });
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1>Plano redagavimas</h1>

      <form className="panel stack" onSubmit={askAi}>
        <label className="field" htmlFor="ai-instruction">Paprašyk AI pakeisti planą</label>
        <div className="row">
          <input
            id="ai-instruction"
            className="input grow"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Pvz.: sutrumpink pirmadienį arba pakeisk lenkimus kitu pratimu"
            disabled={busy}
          />
          <button className="button button-primary" type="submit" disabled={busy || instruction.trim().length < 3}>
            {busy ? "Dirbama…" : "Klausti AI"}
          </button>
        </div>
      </form>

      {notice && <p className="notice" role="status">{notice}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {plan.days.map((day) => (
        <section key={day.day} className="day">
          <h2>{weekdayLabel(day.day)}</h2>
          {day.exercises.map((planned) => (
            <div key={planned.exerciseId} className="editor-exercise">
              <span className="row">
                <ExerciseImage exerciseId={planned.exerciseId} name={nameOf(planned.exerciseId)} size={48} />
                {nameOf(planned.exerciseId)}
              </span>
              <input
                className="input input-number"
                type="number"
                min={1}
                max={10}
                value={planned.sets}
                aria-label="Serijos"
                onChange={(event) => updateExercise(day.day, planned.exerciseId, { sets: Number(event.target.value) })}
              />
              <input
                className="input input-number"
                type="number"
                min={1}
                max={50}
                value={planned.reps}
                aria-label="Pakartojimai"
                onChange={(event) => updateExercise(day.day, planned.exerciseId, { reps: Number(event.target.value) })}
              />
              <button
                className="button button-quiet"
                type="button"
                onClick={() => updateDay(day.day, (dayExercises) => dayExercises.filter((item) => item.exerciseId !== planned.exerciseId))}
              >
                Pašalinti
              </button>
            </div>
          ))}
          {pickerDay === day.day ? (
            <ExercisePicker
              exercises={exercises}
              excludedIds={day.exercises.map((planned) => planned.exerciseId)}
              onPick={(exerciseId) => {
                updateDay(day.day, (dayExercises) => [...dayExercises, { exerciseId, sets: 3, reps: 10 }]);
                setPickerDay(null);
              }}
              onClose={() => setPickerDay(null)}
            />
          ) : (
            <button className="button button-quiet" type="button" onClick={() => setPickerDay(day.day)}>
              Pridėti pratimą
            </button>
          )}
        </section>
      ))}

      <div className="row">
        <button className="button button-primary" type="button" onClick={save} disabled={busy}>Išsaugoti planą</button>
        <button className="button" type="button" onClick={onCancel} disabled={busy}>Atšaukti</button>
      </div>
      <p className="muted small">Išsaugant planas patikrinamas. Jei kas nors pažeidžia taisyklę, pamatysi įspėjimą.</p>
    </div>
  );
}
