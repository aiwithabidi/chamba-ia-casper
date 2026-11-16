"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Short invite link: forwards /i/CODE to sign-up with the referral code. */
export function InviteRedirect() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const target = `/entrar?modo=registro&ref=${encodeURIComponent(code)}`;

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return (
    <main className="grid h-dvh place-items-center px-6 text-center">
      <a href={target} className="font-semibold text-primary">
        Continuar a Chamba IA
      </a>
    </main>
  );
}
