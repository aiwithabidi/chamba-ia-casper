"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { ActivityCard } from "@/components/activity-card";
import { AdminRow } from "@/components/admin-row";
import { AlgorithmRow } from "@/components/algorithm-panel";
import { InviteCard } from "@/components/invite-card";
import { ProgressCard } from "@/components/progress-card";
import { TalentCard } from "@/components/talent-card";
import { TourReplayLink } from "@/components/tour";
import { PillButton, PillLink, RowLink, SectionLabel } from "@/components/ui";
import { TopBar } from "@/components/wallet-pill";
import { api } from "../../../../convex/_generated/api";
import { COUNTRIES, VARIANT_LABEL } from "../../../../convex/lib/domain";

export default function Perfil() {
  const profile = useQuery(api.profiles.me);
  const card = useQuery(api.screenings.myCard);
  const proven = useQuery(api.outcomes.myVerified);
  const { signOut } = useAuthActions();
  if (!profile) return null;

  const country = COUNTRIES.find((c) => c.code === profile.country)?.label ?? profile.country;

  return (
    <>
      <TopBar title="Perfil" />
      <div className="scroll-body space-y-5 px-4">
        <div className="flex items-center gap-4 rounded-card bg-surface p-5">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-surface-2 text-2xl font-bold">
            {profile.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-bold tracking-tight">{profile.name}</p>
            <p className="text-sm text-muted">
              {country} · {VARIANT_LABEL[profile.variant]} · {profile.hoursPerWeek}h/sem
            </p>
          </div>
        </div>

        <AlgorithmRow />

        <ActivityCard />

        <AdminRow />

        <InviteCard />

        <ProgressCard />

        {card ? (
          <div data-tour="talent">
            <TalentCard name={profile.name} card={card} score={card.avgScore} provenOn={proven} />
          </div>
        ) : (
          <Link
            href="/guardados"
            data-tour="talent"
            className="flex items-center gap-3 rounded-card border border-line p-5"
          >
            <div className="flex-1">
              <p className="text-[17px] font-bold">Tu tarjeta de talento</p>
              <p className="text-sm text-muted">Haz tu primera pre-entrevista para desbloquearla</p>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-muted" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <PillLink href="/onboarding" variant="secondary" size="md">
            Editar perfil
          </PillLink>
          <PillButton
            variant="secondary"
            size="md"
            onClick={() => signOut()}
            className="text-muted"
          >
            Cerrar sesión
          </PillButton>
        </div>
        <TourReplayLink />
        <RowLink
          href="/talento"
          icon={Users}
          label="Comunidad de testers"
          hint="Las tarjetas de talento de todos"
        />
      </div>
    </>
  );
}
