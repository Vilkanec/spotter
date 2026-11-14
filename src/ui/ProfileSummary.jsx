import { EQUIPMENT_LABELS, LEVEL_LABELS, PAIN_LABELS, WEEKDAY_LABELS } from "@/core/labels";
import { sortWeekdays } from "@/core/profile";

function listOrNone(items) {
  return items.length > 0 ? items.join(", ") : "Nėra";
}

export function ProfileSummary({ profile }) {
  return (
    <dl className="summary">
      <dt>Lygis</dt>
      <dd>{LEVEL_LABELS[profile.level]}</dd>
      <dt>Dienos</dt>
      <dd>{sortWeekdays(profile.trainingDays).map((day) => WEEKDAY_LABELS[day]).join(", ")}</dd>
      <dt>Trukmė</dt>
      <dd>{profile.sessionMinutes} min.</dd>
      <dt>Įranga</dt>
      <dd>{listOrNone(profile.equipment.map((item) => EQUIPMENT_LABELS[item]))}</dd>
      <dt>Skausmai</dt>
      <dd>{listOrNone(profile.pains.map((pain) => PAIN_LABELS[pain]))}</dd>
    </dl>
  );
}
