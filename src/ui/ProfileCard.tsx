import Link from "next/link";
import type { Profile } from "@/domain/profile";
import type { Tenant } from "@/persistence/TenantRepository";
import { ProfileSummary } from "./ProfileSummary";

export function ProfileCard({ tenant, profile }: { tenant: Tenant; profile: Profile }) {
  return (
    <section className="panel stack">
      <div className="day-header">
        <h2>{tenant.name}</h2>
        <Link className="button button-quiet" href="/onboarding">Keisti profilį</Link>
      </div>
      <p className="muted">{tenant.description}</p>
      <ProfileSummary profile={profile} />
    </section>
  );
}
