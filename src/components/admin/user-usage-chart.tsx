"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export type UserUsageBar = { label: string; minutes: number };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: UserUsageBar }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-[0_8px_24px_-12px_rgba(19,32,30,0.25)]">
      <p className="font-medium text-ink">{point.label}</p>
      <p className="mt-1 text-ink-soft">
        <span className="font-mono font-semibold text-accent-ink">{point.minutes}m</span> total time on site
      </p>
    </div>
  );
}

export function UserUsageChart({ data }: { data: UserUsageBar[] }) {
  return (
    <div className="w-full" style={{ height: Math.max(180, data.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${v}m`}
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "var(--color-surface-2)" }} content={<CustomTooltip />} />
          <Bar dataKey="minutes" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={500}>
            {data.map((_, i) => (
              <Cell key={i} fill="var(--color-accent)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
