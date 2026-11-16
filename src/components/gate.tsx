"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function Spinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div
        role="status"
        aria-label="Cargando"
        className="size-8 animate-spin rounded-full border-[3px] border-line border-t-primary motion-reduce:animate-none"
      />
    </div>
  );
}

/** Requires sign-in and a finished profile; redirects otherwise. */
export function RequireProfile({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");
  const signedIn = useQuery(api.users.signedIn, isAuthenticated ? {} : "skip");
  const { signOut } = useAuthActions();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/entrar");
    // Dead session: the client has a token but the server no longer knows the user.
    else if (signedIn === false) void signOut().then(() => router.replace("/entrar"));
    else if (signedIn && profile === null) router.replace("/onboarding");
  }, [isLoading, isAuthenticated, signedIn, profile, router, signOut]);

  // Always render children so Next can prerender the segment; cover it until the profile is ready.
  const ready = !isLoading && isAuthenticated && !!profile;
  return (
    <>
      {children}
      {!ready && (
        <div className="fixed inset-0 z-[60] bg-bg">
          <Spinner />
        </div>
      )}
    </>
  );
}
