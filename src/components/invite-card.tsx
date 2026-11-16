"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, Share2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

/** "Invita a 3 amigos": 3 slots, the code, and a native share button. */
export function InviteCard() {
  const invite = useQuery(api.referrals.mine);
  const claimCode = useMutation(api.referrals.claimCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (invite && !invite.stored) void claimCode();
  }, [invite, claimCode]);

  if (!invite) return null;
  const full = invite.friends.length >= invite.max;

  async function share() {
    // Short /i/CODE link carries the invite preview card. URL only in `url`: iMessage duplicates it if `text` has it too.
    const url = `${window.location.origin}/i/${encodeURIComponent(invite!.code)}`;
    const text = `Únete a Chamba IA con mi código ${invite!.code}.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Chamba IA", text, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    if (!(await copyText(url))) {
      window.prompt("Copia tu enlace:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="invita" className="space-y-4 rounded-[24px] bg-surface p-5">
      <div>
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">Invita</p>
        <p className="text-lg font-bold">Invita a {invite.max} amigos que hablen español</p>
        <p className="text-sm text-muted">Cuando tu amigo(a) crea su perfil, aparece aquí.</p>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {Array.from({ length: invite.max }, (_, i) => invite.friends[i]).map((name, i) => (
          <li
            key={i}
            className={`flex flex-col items-center gap-1.5 rounded-[20px] p-3 text-center ${name ? "bg-surface-2" : "border border-dashed border-line"}`}
          >
            <span
              className={`grid size-10 place-items-center rounded-full ${name ? "bg-like/15 text-like" : "text-muted"}`}
            >
              {name ? <Check size={18} strokeWidth={2.5} /> : <UserPlus size={18} />}
            </span>
            <span
              className={`w-full truncate text-[13px] font-semibold ${name ? "" : "text-muted"}`}
            >
              {name ?? "Libre"}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted">Tu código</p>
          <p className="font-mono text-lg font-bold tracking-widest">{invite.code}</p>
        </div>
        <button
          onClick={share}
          disabled={full}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-bold ${full ? "bg-surface-2 text-muted" : "bg-accent"}`}
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          {full ? "Completo" : copied ? "Enlace copiado" : "Compartir"}
        </button>
      </div>
    </section>
  );
}

/** Clipboard API needs a secure context; fall back to execCommand (e.g. http on a LAN dev server). */
async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand("copy");
  el.remove();
  return ok;
}
