import { redirect } from "next/navigation";
import { currentServices, currentTenant } from "@/server/tenantContext";
import { AppHeader } from "@/ui/AppHeader";
import { PlanDashboard } from "@/ui/PlanDashboard";
import { ProfileCard } from "@/ui/ProfileCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { onboarding, plans } = await currentServices();
  const profile = onboarding.findProfile();
  if (!profile) redirect("/onboarding");

  return (
    <main className="page stack">
      <AppHeader />
      <ProfileCard tenant={await currentTenant()} profile={profile} />
      <PlanDashboard profile={profile} overview={plans.overview(new Date())} />
    </main>
  );
}
