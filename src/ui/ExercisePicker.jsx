"use client";

import { useState } from "react";
import { EXERCISE_CATALOG } from "@/core/exerciseCatalog";
import { MUSCLE_LABELS } from "@/core/labels";
import { ExerciseImage } from "./ExerciseImage";

export function ExercisePicker({ excludedIds, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const matches = EXERCISE_CATALOG.filter(
    (exercise) =>
      !excludedIds.includes(exercise.id) &&
      (exercise.name.toLowerCase().includes(normalizedQuery) || MUSCLE_LABELS[exercise.muscleGroup].includes(normalizedQuery)),
  );

  return (
    <div className="picker">
      <div className="row">
        <input
          className="input picker-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ieškok pagal pavadinimą arba raumenų grupę"
          aria-label="Ieškoti pratimų"
          autoFocus
        />
        <button className="button button-quiet" type="button" onClick={onClose}>Uždaryti</button>
      </div>
      <ul className="picker-list">
        {matches.map((exercise) => (
          <li key={exercise.id} className="picker-row">
            <ExerciseImage exerciseId={exercise.id} name={exercise.name} />
            <button className="picker-option" type="button" onClick={() => onPick(exercise.id)}>
              {exercise.name}
              <span className="muted small picker-muscle">{MUSCLE_LABELS[exercise.muscleGroup]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
