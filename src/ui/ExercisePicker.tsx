"use client";

import { useState } from "react";
import { MUSCLE_LABELS, type Exercise } from "@/domain/exercise";
import { ExerciseImage } from "./ExerciseImage";

interface ExercisePickerProps {
  exercises: Exercise[];
  excludedIds: string[];
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}

export function ExercisePicker({ exercises, excludedIds, onPick, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const matches = exercises.filter(
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
