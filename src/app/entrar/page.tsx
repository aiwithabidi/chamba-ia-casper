"use client";

import {
  useSignInWithUsernamePassword,
  useSignUpWithUsernamePassword,
} from "@convex-dev/auth/methods/username-password/react";
import { useConvexAuth } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ErrorNote, PillButton } from "@/components/ui";
import { api } from "../../../convex/_generated/api";

const ERRORS: Record<string, string> = {
  USERNAME_TAKEN: "Ese usuario ya existe. Prueba otro o inicia sesión.",
  USERNAME_TOO_SHORT: "El usuario es muy corto.",
  PASSWORD_TOO_SHORT: "La contraseña es muy corta (mínimo 8 caracteres).",
  PASSWORD_TOO_LONG: "La contraseña es muy larga.",
  PASSWORD_TOO_COMMON: "Esa contraseña es muy común. Elige otra.",
  PASSWORD_HAS_SURROUNDING_WHITESPACE: "Quita los espacios al inicio o al final.",
  INVALID_CREDENTIALS: "Usuario o contraseña incorrectos.",
  USER_NOT_FOUND: "No encontramos ese usuario.",
  RATE_LIMITED: "Demasiados intentos. Espera un momento.",
};

function AuthForm() {
  const params = useSearchParams();
  const [signup, setSignup] = useState(params.get("modo") === "registro");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signIn, pending: p1 } = useSignInWithUsernamePassword(api.auth);
  const { signUp, pending: p2 } = useSignUpWithUsernamePassword(api.auth);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) sessionStorage.setItem("chamba_ref", ref);
  }, [params]);

  useEffect(() => {
    if (isAuthenticated) router.replace(signup ? "/onboarding" : "/descubrir");
  }, [isAuthenticated, signup, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const creds = { username: username.trim().toLowerCase(), password };
    const result = signup ? await signUp(creds) : await signIn(creds);
    if (result.status !== "complete") {
      const code =
        "userError" in result ? (result.userError as { error: string }).error : "OTHER_ERROR";
      setError(ERRORS[code] ?? "Algo salió mal. Intenta de nuevo.");
    }
  }

  return (
    <main className="pt-safe pb-safe screen flex flex-col overflow-hidden">
      <form
        onSubmit={submit}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col justify-center-safe gap-4 px-6 py-4"
      >
        <Logo size={22} className="mb-4" />
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">
          {signup ? "Crea tu cuenta" : "Bienvenido(a) de vuelta"}
        </h1>
        <p className="text-muted">{signup ? "Solo usuario y contraseña." : "Entra para seguir."}</p>
        <label className="space-y-1">
          <span className="text-sm text-muted">Usuario</span>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-field border border-line bg-surface px-4 py-3.5 text-[17px] outline-none focus:border-primary"
            placeholder="valeria.mde"
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Contraseña</span>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-field border border-line bg-surface px-4 py-3.5 text-[17px] outline-none focus:border-primary"
            placeholder="Mínimo 8 caracteres"
            required
          />
        </label>
        {error && <ErrorNote>{error}</ErrorNote>}
        <PillButton type="submit" disabled={p1 || p2} className="mt-2">
          {p1 || p2 ? "Un momento…" : signup ? "Crear cuenta" : "Entrar"}
        </PillButton>
        <PillButton variant="secondary" size="md" onClick={() => setSignup(!signup)}>
          {signup ? "¿Ya tienes cuenta? Inicia sesión" : "¿Nuevo(a)? Crea una cuenta"}
        </PillButton>
      </form>
    </main>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
