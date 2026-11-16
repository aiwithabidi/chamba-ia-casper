"use client";

import {
  ArrowDown,
  Download,
  Menu,
  Share,
  ShieldCheck,
  Smartphone,
  SquarePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Spinner } from "@/components/gate";
import { Mark } from "@/components/logo";
import { PillButton } from "@/components/ui";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type Platform = "pending" | "standalone" | "android" | "ios" | "ios-other" | "desktop";

const NEXT = "/descubrir";

// UA only picks instruction copy; the Android button is gated on the captured event.
function readPlatform(): Platform {
  const standalone =
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "standalone";
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return /CriOS|FxiOS|EdgiOS/.test(ua) ? "ios-other" : "ios";
  return /Android/.test(ua) ? "android" : "desktop";
}
const subscribeStandalone = (cb: () => void) => {
  const mq = matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Post-onboarding screen: add Chamba to the Home Screen, then Descubrir.
 * The session is an httpOnly cookie; whether iOS carries it into the installed
 * app is unconfirmed on a device, so the sign-in line stays.
 */
export function InstallStep() {
  const router = useRouter();
  const platform = useSyncExternalStore(
    subscribeStandalone,
    readPlatform,
    () => "pending" as const,
  );
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const mode = installed ? "done" : platform;

  useEffect(() => {
    if (platform === "standalone") router.replace(NEXT);
  }, [platform, router]);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "pending" || mode === "standalone") return <Spinner />;

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setInstalled(true);
  };

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col px-6">
      <div className="flex flex-1 flex-col justify-center gap-5">
        <Mark size={56} className="text-accent" />
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-balance">
          {mode === "done" ? "¡Listo! Chamba ya está en tu inicio" : "Ten Chamba a un toque"}
        </h1>

        {mode !== "done" && (
          <div data-tour="install" className="flex flex-col gap-5">
            {mode === "android" ? (
              <>
                {deferred && (
                  <PillButton onClick={install}>
                    <Download size={20} strokeWidth={2} /> Instalar Chamba
                  </PillButton>
                )}
                <p className="text-[15px] text-muted">Menú ⋮ → Instalar app</p>
              </>
            ) : mode === "ios" ? (
              <IOSSteps />
            ) : mode === "ios-other" ? (
              <p className="text-[15px] text-muted">Ábrela en Safari para instalarla.</p>
            ) : (
              <p className="flex items-center gap-2 text-[15px] text-muted">
                <Smartphone size={20} strokeWidth={2} className="shrink-0 text-accent" />
                Abre Chamba en tu celular para instalarla.
              </p>
            )}
          </div>
        )}

        <p className="text-[15px]">Abre la app y entra con tu usuario y contraseña.</p>

        <TrustCard />
      </div>

      <PillButton variant="secondary" size="md" onClick={() => router.replace(NEXT)}>
        {mode === "done" ? "Seguir en el navegador" : "Ahora no"}
      </PillButton>
    </main>
  );
}

function IOSSteps() {
  const steps = [
    {
      Icon: Menu,
      title: "Toca ☰ abajo a la izquierda",
      note: "En la barra de Safari, junto a la dirección.",
    },
    {
      Icon: Share,
      title: "Toca Compartir",
      note: "Luego toca Ver más si no ves la lista completa.",
    },
    {
      Icon: SquarePlus,
      title: "Toca “Agregar a inicio”",
      note: "Deja “Abrir como app web” activado y toca Agregar.",
    },
  ];
  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {steps.map(({ Icon, title, note }, i) => (
          <li key={title} className="flex items-center gap-3 rounded-[20px] bg-surface p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent">
              <Icon size={20} strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold">
                {i + 1}. {title}
              </span>
              <span className="block text-[13px] text-muted">{note}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-accent">
        El menú ☰ está en la barra de abajo
        <ArrowDown size={18} strokeWidth={2.5} className="motion-safe:animate-bounce" aria-hidden />
      </p>
    </div>
  );
}

const TRUST = [
  "Chamba es gratis. Nunca te cobraremos.",
  "No somos el empleador: te preparamos y te presentamos con empresas que buscan hispanohablantes para entrenar IA.",
  "Nunca te pediremos dinero, depósitos ni datos bancarios, ni por WhatsApp.",
];

function TrustCard() {
  return (
    <div className="flex gap-3 rounded-[20px] bg-surface p-4">
      <ShieldCheck size={22} strokeWidth={2} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <ul className="space-y-1.5 text-[14px] leading-snug text-muted">
        {TRUST.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
