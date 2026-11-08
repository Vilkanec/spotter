import { z } from "zod";
import type { AiClient } from "@/ai/AiClient";
import type { ChatMessage } from "@/domain/onboarding";
import {
  EQUIPMENT,
  MAX_SESSION_MINUTES,
  MAX_TRAINING_DAYS,
  MIN_SESSION_MINUTES,
  MIN_TRAINING_DAYS,
  PAINS,
  ProfileSchema,
  WEEKDAYS,
  type Profile,
} from "@/domain/profile";
import type { ProfileRepository } from "@/persistence/ProfileRepository";
import { InputError } from "./errors";

export interface OnboardingReply {
  message: string;
  profile: Profile | null;
}

type ProfileField = keyof Profile;

const FIELD_ORDER: ProfileField[] = ["level", "trainingDays", "sessionMinutes", "equipment", "pains"];

const QUESTIONS: Record<ProfileField, { ask: string; retry: string }> = {
  level: {
    ask: "Kokia tavo patirtis: pradedantysis, vidutinis ar pažengęs?",
    retry: "Nesupratau tavo lygio. Esi pradedantysis, vidutinis ar pažengęs?",
  },
  trainingDays: {
    ask: "Kuriomis savaitės dienomis gali sportuoti?",
    retry: `Sportuoti galima nuo ${MIN_TRAINING_DAYS} iki ${MAX_TRAINING_DAYS} dienų per savaitę. Kurios dienos tau tinka?`,
  },
  sessionMinutes: {
    ask: "Kiek minučių turi vienai treniruotei?",
    retry: `Treniruotė turi trukti nuo ${MIN_SESSION_MINUTES} iki ${MAX_SESSION_MINUTES} minučių. Kiek laiko gali skirti?`,
  },
  equipment: {
    ask: "Kokią įrangą gali naudoti? Pavyzdžiui, hantelius, štangą, suoliuką, skersinį ar visą sporto salę.",
    retry: "Ką iš šių turi: hantelius, štangą, suoliuką, skersinį, girą, lyninį treniruoklį, kojų treniruoklius?",
  },
  pains: {
    ask: "Ar skauda kelius, nugarą ar pečius?",
    retry: "Parašyk, ar skauda kelius, nugarą ar pečius, arba kad niekas neskauda.",
  },
};

const ChatSchema = z
  .array(z.object({ role: z.enum(["assistant", "user"]), text: z.string().trim().min(1).max(2000) }))
  .min(1)
  .max(40);

export class OnboardingService {
  constructor(
    private readonly ai: AiClient,
    private readonly profiles: ProfileRepository,
  ) {}

  findProfile(): Profile | null {
    return this.profiles.find();
  }

  async reply(input: unknown): Promise<OnboardingReply> {
    const messages = ChatSchema.safeParse(input);
    if (!messages.success) throw new InputError("Netinkamas pokalbis.");

    const extracted = await this.ai.generateJson(this.extractionPrompt(messages.data));
    const fields = extracted !== null && typeof extracted === "object" ? (extracted as Record<string, unknown>) : {};

    for (const field of FIELD_ORDER) {
      const value = fields[field];
      if (value === null || value === undefined) return { message: QUESTIONS[field].ask, profile: null };
      if (!ProfileSchema.shape[field].safeParse(value).success) return { message: QUESTIONS[field].retry, profile: null };
    }

    return {
      message: "Ačiū! Štai tavo profilis. Patikrink ir patvirtink, jei viskas teisinga.",
      profile: ProfileSchema.parse(fields),
    };
  }

  confirm(input: unknown): Profile {
    const profile = ProfileSchema.safeParse(input);
    if (!profile.success) throw new InputError("Profilis neužpildytas arba netinkamas.");

    this.profiles.save(profile.data);
    return profile.data;
  }

  private extractionPrompt(messages: ChatMessage[]): string {
    const transcript = messages.map((message) => `${message.role}: ${message.text}`).join("\n");
    return [
      "Extract a training profile from this onboarding conversation. Use only facts the user stated.",
      "Return JSON with exactly these keys, using null for anything the user has not stated yet:",
      '- "level": 1 for beginner, 2 for intermediate, 3 for advanced.',
      `- "trainingDays": specific weekdays from ${JSON.stringify(WEEKDAYS)}. Use null if the user only gave a count without naming days.`,
      '- "sessionMinutes": minutes available per workout, as an integer.',
      `- "equipment": items from ${JSON.stringify(EQUIPMENT)}. A gym means all items. No equipment means [].`,
      `- "pains": items from ${JSON.stringify(PAINS)}. Nothing hurts means [].`,
      "The user may write in any language.",
      `Conversation:\n${transcript}`,
    ].join("\n");
  }
}
