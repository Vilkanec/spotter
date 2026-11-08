"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Exercise } from "@/domain/exercise";
import type { WeeklyPlan } from "@/domain/plan";
import { sortWeekdays, type Profile } from "@/domain/profile";
import type { GenerationResult } from "@/planning/PlanGenerator";
import type { PlanOverview } from "@/services/PlanService";
import { errorMessage, sendJson } from "./api";
import { PlanEditor } from "./PlanEditor";
import { PlanView } from "./PlanView";

interface PlanDashboardProps {
  profile: Profile;
  overview: PlanOverview | null;
  exercises: Exercise[];
}

export function PlanDashboard({ profile, overview, exercises }: PlanDashboardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const result = await sendJson<GenerationResult>("/api/plan/generate", "POST");
      if (result.status === "error") setError(result.message);
      router.refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function save(plan: WeeklyPlan) {
    await sendJson("/api/plan", "PUT", plan);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    const emptyPlan: WeeklyPlan = { days: sortWeekdays(profile.trainingDays).map((day) => ({ day, exercises: [] })) };
    return <PlanEditor initialPlan={overview?.plan ?? emptyPlan} exercises={exercises} onSave={save} onCancel={() => setEditing(false)} />;
  }

  return (
    <div className="stack">
      {overview ? (
        <PlanView overview={overview} exercises={exercises} />
      ) : (
        <p className="muted">Plano dar nėra. Sugeneruok jį su AI arba susidaryk pats. Kiekvienas planas tikrinamas pagal aukščiau esantį profilį.</p>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      {busy && <p className="muted">Generuojamas ir tikrinamas planas. Tai gali užtrukti iki minutės.</p>}

      <div className="row">
        <button className="button button-primary" type="button" onClick={generate} disabled={busy}>
          {overview ? "Generuoti naują planą" : "Generuoti planą"}
        </button>
        <button className="button" type="button" onClick={() => setEditing(true)} disabled={busy}>
          {overview ? "Redaguoti planą" : "Susidaryti pačiam"}
        </button>
      </div>

      <p className="muted small">Spotter nėra gydytojo patarimas. Pratimai atrenkami pagal tavo nurodytus skausmus.</p>
    </div>
  );
}
