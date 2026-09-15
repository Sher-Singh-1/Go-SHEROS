"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

export type MultiLinePoint = { date: string; tasks: number; goals: number; habits: number };

// Blue / green / amber — three hues far enough apart on the wheel to stay
// distinguishable overlaid on one chart (accent + teal were both blue-ish
// and blended together here).
const SERIES: { key: keyof Omit<MultiLinePoint, "date">; label: string; color: string }[] = [
  { key: "tasks", label: "Daily tasks", color: "var(--color-accent)" },
  { key: "goals", label: "Goals", color: "var(--color-success)" },
  { key: "habits", label: "Habits", color: "var(--color-warning)" },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-[0_8px_24px_-12px_rgba(19,32,30,0.25)]">
      <p className="font-medium text-ink">{format(new Date(label ?? ""), "EEEE, MMM d")}</p>
      <div className="mt-1 flex flex-col gap-0.5">
        {payload.map((entry) => {
          const meta = SERIES.find((s) => s.key === entry.dataKey);
          return (
            <p key={entry.dataKey} className="text-ink-soft">
              <span className="font-mono font-semibold" style={{ color: entry.color }}>{entry.value}%</span> {meta?.label ?? entry.dataKey}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// Same area-chart language as the single-series trend chart (gradient fill,
// grid, axes, tooltip card) — just three overlaid series instead of one, so
// every tab in the analytics card reads as the same graphic style.
export function MultiLineChart({ data }: { data: MultiLinePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`${s.key}Fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(d), data.length > 16 ? "d" : "EEE")}
            interval={data.length > 16 ? Math.ceil(data.length / 10) : 0}
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }} content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "var(--color-ink-faint)" }}
            formatter={(value) => SERIES.find((s) => s.key === value)?.label ?? value}
          />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#${s.key}Fill)`}
              dot={false}
              activeDot={{ r: 4, fill: s.color, stroke: "var(--color-surface)", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={600}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
