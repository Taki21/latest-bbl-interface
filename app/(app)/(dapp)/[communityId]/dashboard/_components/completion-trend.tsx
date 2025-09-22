"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type TaskLite = { status: string; updatedAt?: string | null; balance?: string | number | bigint | null };

interface Props {
  tasks: TaskLite[];
  tokenSymbol?: string;
}

function toNumber(v: string | number | bigint | null | undefined) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function CompletionTrend({ tasks, tokenSymbol }: Props) {
  const days = 14;
  const sym = tokenSymbol || "TOKEN";

  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets: { [iso: string]: { date: Date; done: number; tokens: number } } = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      buckets[iso] = { date: d, done: 0, tokens: 0 };
    }

    for (const t of tasks) {
      const s = (t.status || "").toLowerCase();
      if (s === "completed" || s === "complete" || s === "done") {
        const when = t.updatedAt ? new Date(t.updatedAt) : null;
        if (when && !Number.isNaN(when.getTime())) {
          when.setHours(0, 0, 0, 0);
          const iso = when.toISOString().slice(0, 10);
          if (buckets[iso]) {
            buckets[iso].done += 1;
            buckets[iso].tokens += toNumber(t.balance ?? 0);
          }
        }
      }
    }
    return Object.entries(buckets).map(([iso, v]) => ({
      iso,
      label: v.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      done: v.done,
      tokens: v.tokens,
    }));
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Completion Trend</CardTitle>
        <CardDescription>Last {days} days: tasks and {sym}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-64"
          config={{
            done: { label: "Tasks done", color: "hsl(var(--primary))" },
            tokens: { label: `${sym} awarded`, color: "hsl(var(--muted-foreground))" },
          }}
        >
          <LineChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="done" stroke="var(--color-done)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tokens" stroke="var(--color-tokens)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

