"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

export type SiteUsagePoint = { date: string; minutes: number; activeUsers: number };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SiteUsagePoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-[0_8px_24px_-12px_rgba(19,32,30,0.25)]">
      <p className="font-medium text-ink">{format(new Date(point.date), "EEEE, MMM d")}</p>
      <p className="mt-1 text-ink-soft">
        <span className="font-mono font-semibold text-accent-ink">{point.minutes}m</span> total ·{" "}
        {point.activeUsers} active user{point.activeUsers === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function SiteUsageChart({ data }: { data: SiteUsagePoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="siteUsageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
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
            tickFormatter={(v) => `${v}m`}
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }} content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="minutes"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            fill="url(#siteUsageFill)"
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
