import type { WeeklyPlan } from "@/domain/plan";
import type { Profile } from "@/domain/profile";

export interface SampleTenant {
  id: string;
  name: string;
  description: string;
  profile: Profile;
  plan: WeeklyPlan | null;
}

export const SAMPLE_TENANTS: SampleTenant[] = [
  {
    id: "alex",
    name: "Alex",
    description: "Biuro darbuotojas, prieš mėnesį pradėjęs sportuoti namuose. Turi porą hantelių ir seną kelio traumą iš futbolo.",
    profile: {
      level: 1,
      trainingDays: ["monday", "wednesday", "friday"],
      sessionMinutes: 45,
      equipment: ["dumbbells"],
      pains: ["knee"],
    },
    plan: null,
  },
  {
    id: "rita",
    name: "Rita",
    description: "Dvejus metus sportuoja nedidelėje sporto salėje ir nori sustiprėti pagrindiniuose štangos pratimuose. Traumų neturi.",
    profile: {
      level: 2,
      trainingDays: ["tuesday", "thursday", "saturday"],
      sessionMinutes: 60,
      equipment: ["barbell", "bench", "dumbbells", "pullup_bar"],
      pains: [],
    },
    plan: {
      days: [
        { day: "tuesday", exercises: [{ exerciseId: "barbell-back-squat", sets: 4, reps: 6 }, { exerciseId: "pull-up", sets: 3, reps: 8 }] },
        { day: "thursday", exercises: [{ exerciseId: "barbell-bench-press", sets: 4, reps: 6 }, { exerciseId: "hammer-curl", sets: 3, reps: 12 }] },
        { day: "saturday", exercises: [{ exerciseId: "barbell-row", sets: 3, reps: 8 }, { exerciseId: "dead-bug", sets: 3, reps: 12 }] },
      ],
    },
  },
];
