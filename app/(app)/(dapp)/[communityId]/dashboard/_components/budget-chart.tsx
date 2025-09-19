"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ProjectLike {
  id: string;
  title: string;
  balance: string | number | bigint;
}

interface Props {
  tokenSymbol?: string;
  projects: ProjectLike[];
}

function toNumber(v: string | number | bigint | null | undefined) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function BudgetChart({ projects, tokenSymbol }: Props) {
  const top = [...projects]
    .sort((a, b) => toNumber(b.balance) - toNumber(a.balance))
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.title, value: toNumber(p.balance) }));

  const sym = tokenSymbol || "TOKEN";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Project Balances</CardTitle>
        <CardDescription>Top 5 projects by balance</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-64"
          config={{ value: { label: `Balance (${sym})`, color: "hsl(var(--primary))" } }}
        >
          <BarChart data={top} layout="vertical" margin={{ left: 12 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={140} />
            <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={4}>
              {top.map((_, i) => (
                <Cell key={i} fill="hsl(var(--primary))" />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

