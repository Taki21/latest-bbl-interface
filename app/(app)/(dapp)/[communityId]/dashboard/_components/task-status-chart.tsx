"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type TaskLike = { status: string };

interface Props {
  tasks: TaskLike[];
}

const LABELS: Record<string, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "under-review": "Under review",
  completed: "Completed",
};

const COLORS = {
  notStarted: { light: "#94a3b8", dark: "#94a3b8" }, // slate-400
  inProgress: { light: "#3b82f6", dark: "#60a5fa" }, // blue-500/400
  underReview: { light: "#f59e0b", dark: "#fbbf24" }, // amber-500/400
  completed: { light: "#10b981", dark: "#34d399" }, // emerald-500/400
};

export default function TaskStatusChart({ tasks }: Props) {
  const counts = tasks.reduce(
    (acc, t) => {
      const s = (t.status || "").toLowerCase();
      if (s === "completed" || s === "complete" || s === "done") acc.completed++;
      else if (s === "in-progress") acc.inProgress++;
      else if (s === "under-review") acc.underReview++;
      else acc.notStarted++;
      return acc;
    },
    { notStarted: 0, inProgress: 0, underReview: 0, completed: 0 }
  );

  const data = [
    { key: "notStarted", label: LABELS["not-started"], value: counts.notStarted, fill: "var(--color-notStarted)" },
    { key: "inProgress", label: LABELS["in-progress"], value: counts.inProgress, fill: "var(--color-inProgress)" },
    { key: "underReview", label: LABELS["under-review"], value: counts.underReview, fill: "var(--color-underReview)" },
    { key: "completed", label: LABELS["completed"], value: counts.completed, fill: "var(--color-completed)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Task Status</CardTitle>
        <CardDescription>Breakdown across all tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            notStarted: { label: LABELS["not-started"], theme: COLORS.notStarted },
            inProgress: { label: LABELS["in-progress"], theme: COLORS.inProgress },
            underReview: { label: LABELS["under-review"], theme: COLORS.underReview },
            completed: { label: LABELS["completed"], theme: COLORS.completed },
          }}
          className="h-64"
        >
          <BarChart data={data} barCategoryGap={20}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} />
            <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="value" nameKey="label" radius={4}>
              {data.map((d) => (
                <Cell key={d.key} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
