"use client";

import { useState } from "react";
import { exerciseName } from "@/core/exercises";
import { WEEKDAY_LABELS } from "@/core/labels";
import { errorMessage, sendJson } from "./api";
import { ExerciseImage } from "./ExerciseImage";
import { ExercisePicker } from "./ExercisePicker";

const NEW_EXERCISE_SETS = 3;
const NEW_EXERCISE_REPS = 10;

export function PlanEditor({ initialPlan, onSave, onCancel }) {
  const [plan, setPlan] = useState(initialPlan);
  const [pickerDay, setPickerDay] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  function updateDay(day, change) {
    setPlan({
      days: plan.days.map((planDay) => (planDay.day === day ? { ...planDay, exercises: change(planDay.exercises) } : planDay)),
    });
  }

  function updateExercise(day, exerciseId, change) {
    updateDay(day, (dayExercises) =>
      dayExercises.map((planned) => (planned.exerciseId === exerciseId ? { ...planned, ...change } : planned)),
    );
  }

  function addExercise(day, exerciseId) {
    updateDay(day, (dayExercises) => [...dayExercises, { exerciseId, sets: NEW_EXERCISE_SETS, reps: NEW_EXERCISE_REPS }]);
    setPickerDay(null);
  }

  function removeExercise(day, exerciseId) {
    updateDay(day, (dayExercises) => dayExercises.filter((planned) => planned.exerciseId !== exerciseId));
  }

  async function askAi(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await sendJson("/api/plan/revise", "POST", { plan, instruction });
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
          <h2>{WEEKDAY_LABELS[day.day]}</h2>
          {day.exercises.map((planned) => (
            <div key={planned.exerciseId} className="editor-exercise">
              <span className="row">
                <ExerciseImage exerciseId={planned.exerciseId} name={exerciseName(planned.exerciseId)} size={48} />
                {exerciseName(planned.exerciseId)}
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
              <button className="button button-quiet" type="button" onClick={() => removeExercise(day.day, planned.exerciseId)}>
                Pašalinti
              </button>
            </div>
          ))}
          {pickerDay === day.day ? (
            <ExercisePicker
              excludedIds={day.exercises.map((planned) => planned.exerciseId)}
              onPick={(exerciseId) => addExercise(day.day, exerciseId)}
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
