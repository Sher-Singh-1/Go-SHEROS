"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Dot,
} from "recharts";
import { format } from "date-fns";

export type SeriesPoint = { date: string; rate: number; completed: number; total: number };

function average(data: SeriesPoint[]) {
  const withTasks = data.filter((d) => d.total > 0);
  if (withTasks.length === 0) return 0;
  return Math.round(withTasks.reduce((sum, d) => sum + d.rate, 0) / withTasks.length);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SeriesPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-[0_8px_24px_-12px_rgba(19,32,30,0.25)]">
      <p className="font-medium text-ink">{format(new Date(point.date), "EEEE, MMM d")}</p>
      {point.total > 0 ? (
        <p className="mt-1 text-ink-soft">
          <span className="font-mono font-semibold text-accent-ink">{point.rate}%</span> · {point.completed}/{point.total} tasks completed
        </p>
      ) : (
        <p className="mt-1 text-ink-faint">No tasks scheduled</p>
      )}
    </div>
  );
}

function renderEndpointDot(
  props: { cx?: number; cy?: number; index?: number; payload?: SeriesPoint; key?: React.Key | null },
  lastIndex: number
) {
  const { cx, cy, index, payload, key } = props;
  const safeKey = key ?? undefined;
  if (cx === undefined || cy === undefined || index !== lastIndex || !payload || payload.total === 0) {
    return <g key={safeKey} />;
  }
  return <Dot key={safeKey} cx={cx} cy={cy} r={4} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={2} />;
}

export function CompletionChart({ data }: { data: SeriesPoint[] }) {
  const avg = average(data);
  const activeDays = data.filter((d) => d.total > 0).length;
  const last = [...data].reverse().find((d) => d.total > 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-4 text-xs text-ink-faint">
        <span>
          <span className="font-mono text-sm font-semibold text-ink">{avg}%</span> average
        </span>
        <span>{activeDays} of {data.length} days had tasks</span>
        {last && (
          <span>
            latest: <span className="font-mono text-ink-soft">{last.rate}%</span>
          </span>
        )}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="completionFill" x1="0" y1="0" x2="0" y2="1">
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
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <ReferenceLine
              y={avg}
              stroke="var(--color-ink-faint)"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `avg ${avg}%`, position: "insideTopRight", fill: "var(--color-ink-faint)", fontSize: 10 }}
            />
            <Tooltip cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }} content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              fill="url(#completionFill)"
              dot={(props) => renderEndpointDot(props, data.length - 1)}
              activeDot={{ r: 5, fill: "var(--color-accent)", stroke: "var(--color-surface)", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
