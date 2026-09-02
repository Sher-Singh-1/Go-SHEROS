import { format, getDay, isSameMonth } from "date-fns";
import { clsx } from "clsx";

export type HeatmapPoint = { date: Date; rate: number; total: number };

function levelFor(point: HeatmapPoint) {
  if (point.total === 0) return 0;
  if (point.rate >= 90) return 4;
  if (point.rate >= 60) return 3;
  if (point.rate >= 30) return 2;
  return 1;
}

const LEVEL_CLASS = ["bg-surface-3", "bg-accent-soft", "bg-accent/40", "bg-accent/70", "bg-accent"];

export function Heatmap({ points }: { points: HeatmapPoint[] }) {
  // Pad the front so the grid starts on a Sunday, matching a GitHub-style graph.
  const leadingBlanks = getDay(points[0]?.date ?? new Date());
  const cells: (HeatmapPoint | null)[] = [...Array(leadingBlanks).fill(null), ...points];
  const weeks: (HeatmapPoint | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Label a week's column with the month name only where the month changes,
  // so the axis reads like a timeline instead of repeating itself.
  let lastLabeledMonth: Date | null = null;
  const monthLabels = weeks.map((week) => {
    const firstReal = week.find((p): p is HeatmapPoint => p !== null);
    if (!firstReal) return "";
    if (lastLabeledMonth && isSameMonth(firstReal.date, lastLabeledMonth)) return "";
    lastLabeledMonth = firstReal.date;
    return format(firstReal.date, "MMM");
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex flex-col gap-1 pr-1 pt-4">
          {["Sun", "", "Tue", "", "Thu", "", "Sat"].map((label, i) => (
            <span key={i} className="flex h-3.5 items-center font-mono text-[9px] text-ink-faint">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              <span className="block h-3.5 font-mono text-[9px] leading-[14px] text-ink-faint">{monthLabels[wi]}</span>
              {week.map((point, di) =>
                point ? (
                  <div
                    key={di}
                    title={`${format(point.date, "MMM d")} — ${point.total ? `${point.rate}% of ${point.total} tasks` : "no tasks"}`}
                    className={clsx("h-3.5 w-3.5 rounded-[3px] transition-transform hover:scale-125", LEVEL_CLASS[levelFor(point)])}
                  />
                ) : (
                  <div key={di} className="h-3.5 w-3.5" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 self-end text-[10px] text-ink-faint">
        <span>Less</span>
        {LEVEL_CLASS.map((cls, i) => (
          <span key={i} className={clsx("h-3 w-3 rounded-[3px]", cls)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
