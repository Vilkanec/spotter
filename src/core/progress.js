export function isExerciseDone(completions, day, exerciseId) {
  return completions.some((completion) => completion.day === day && completion.exerciseId === exerciseId);
}

export function isDayDone(completions, planDay) {
  return planDay.exercises.every((planned) => isExerciseDone(completions, planDay.day, planned.exerciseId));
}

export function weekStartOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${month}-${day}`;
}
