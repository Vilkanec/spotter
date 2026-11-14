import { AppHeader } from "@/ui/AppHeader";
import { OnboardingChat } from "@/ui/OnboardingChat";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <main className="page">
      <AppHeader />
      <OnboardingChat />
    </main>
  );
}
