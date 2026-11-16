"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { SectionLabel } from "@/components/ui";
import { api } from "../../convex/_generated/api";
import { buildGrid, type Cell, currentStreak } from "../../convex/lib/activity";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS = ["L", "", "X", "", "V", "", ""];
// Level 0-4: one flat marigold at rising opacity, no gradients.
const SHADE = ["bg-surface-2", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Month label over the first week column of each month. */
function monthLabels(grid: Cell[][]): string[] {
  return grid.map((week, w) => {
    const month = week[0]?.day.slice(5, 7);
    const prev = grid[w - 1]?.[0]?.day.slice(5, 7);
    return month && month !== prev ? MONTHS[Number(month) - 1] : "";
  });
}

/** Perfil → GitHub-style grid of the days you used Chamba. Nothing is lost for a missed day. */
export function ActivityCard() {
  const days = useQuery(api.activity.heatmap);
  const [now] = useState(() => Date.now());
  if (days === undefined) return null;

  const grid = buildGrid(days, now);
  const active = days.length;
  const streak = currentStreak(days, now);
  const months = monthLabels(grid);

  return (
    <section className="space-y-3 rounded-card bg-surface p-5">
      <SectionLabel>Tu actividad</SectionLabel>
      <p className="text-sm text-muted tabular-nums">
        {active === 0 ? (
          "Cada día que descubres o haces una pre-entrevista se marca aquí."
        ) : (
          <>
            <b className="text-text">{plural(active, "día activo", "días activos")}</b>
            {streak > 1 && ` · racha de ${plural(streak, "día", "días")}`}
          </>
        )}
      </p>

      <div
        role="img"
        aria-label={`${plural(active, "día activo", "días activos")} en las últimas ${grid.length} semanas`}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `auto repeat(${grid.length}, minmax(0, 1fr))` }}
      >
        <span />
        {months.map((m, w) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed column positions
            key={w}
            className="overflow-visible text-[10px] leading-4 whitespace-nowrap text-muted"
          >
            {m}
          </span>
        ))}
        {WEEKDAYS.map((label, d) => (
          <Row key={d} label={label} cells={grid.map((week) => week[d])} />
        ))}
      </div>

      <div className="flex items-center justify-end gap-1 text-[10px] text-muted">
        Menos
        {SHADE.map((s) => (
          <span key={s} className={`size-2.5 rounded-[3px] ${s}`} />
        ))}
        Más
      </div>
    </section>
  );
}

function Row({ label, cells }: { label: string; cells: Cell[] }) {
  return (
    <>
      <span className="pr-1 text-[10px] leading-none text-muted self-center">{label}</span>
      {cells.map((c, w) =>
        c ? (
          <span
            key={c.day}
            title={`${c.day}: ${plural(c.count, "acción", "acciones")}`}
            className={`aspect-square rounded-[3px] ${SHADE[c.level]}`}
          />
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: future days have no date key
          <span key={w} className="aspect-square" />
        ),
      )}
    </>
  );
}
