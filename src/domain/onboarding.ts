export interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

export const ONBOARDING_GREETING =
  "Labas, aš Spotter. Papasakok apie savo treniruotes: kokia tavo patirtis, kuriomis dienomis ir kiek laiko gali sportuoti, kokią įrangą turi ir ar kas nors skauda.";
