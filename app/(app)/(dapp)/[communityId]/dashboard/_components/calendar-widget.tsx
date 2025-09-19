"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface TaskItem {
  id: string;
  name: string;
  deadline: string;
  status?: string;
  members?: { user?: { address?: string | null } | null }[];
}

interface ProjectItem {
  id: string;
  title: string;
  deadline: string;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarWidget({
  tasks,
  projects,
  myAddress,
}: {
  tasks: TaskItem[];
  projects: ProjectItem[];
  myAddress?: string | null;
}) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [mineOnly, setMineOnly] = useState(false);

  const addr = (myAddress || "").toLowerCase();

  const events = useMemo(() => {
    const items: { date: Date; kind: "task" | "project"; id: string; title: string }[] = [];
    const tList = mineOnly
      ? tasks.filter((t) => Array.isArray(t.members) && t.members.some((m) => m?.user?.address?.toLowerCase() === addr))
      : tasks;
    for (const t of tList) {
      const d = new Date(t.deadline);
      if (!Number.isNaN(d.getTime())) items.push({ date: d, kind: "task", id: t.id, title: t.name });
    }
    for (const p of projects) {
      const d = new Date(p.deadline);
      if (!Number.isNaN(d.getTime())) items.push({ date: d, kind: "project", id: p.id, title: p.title });
    }
    return items;
  }, [tasks, projects, mineOnly, addr]);

  const byDay = useMemo(() => {
    const map = new Map<string, { date: Date; items: typeof events }>();
    for (const e of events) {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { date: d, items: [] as any });
      map.get(key)!.items.push(e);
    }
    return map;
  }, [events]);

  const dayHasEvent = (day: Date) => byDay.has(new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString().slice(0, 10));

  const list = useMemo(() => {
    if (!selected) return [] as { kind: "task" | "project"; id: string; title: string }[];
    const key = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate())
      .toISOString()
      .slice(0, 10);
    return byDay.get(key)?.items ?? [];
  }, [selected, byDay]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calendar</CardTitle>
          {myAddress ? (
            <div className="flex items-center gap-2">
              <Label htmlFor="mine-only" className="text-xs">Mine only</Label>
              <Switch id="mine-only" checked={mineOnly} onCheckedChange={(v) => setMineOnly(Boolean(v))} />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d: any) => setSelected(d || selected)}
          modifiers={{ hasEvent: dayHasEvent }}
          modifiersClassNames={{ hasEvent: "after:block after:mx-auto after:mt-1 after:h-1 after:w-1 after:rounded-full after:bg-primary" }}
        />
        <div className="space-y-2">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items on this day.</p>
          ) : (
            list.map((e) => (
              <div key={`${e.kind}-${e.id}`} className="flex items-center justify-between text-sm">
                <span className="truncate">{e.title}</span>
                <Badge variant={e.kind === "task" ? "secondary" : "outline"} className="shrink-0">
                  {e.kind}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

