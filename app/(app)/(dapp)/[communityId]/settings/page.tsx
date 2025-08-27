"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address } = useAccount();
  const [member, setMember] = useState<{ id: string; name: string }>({ id: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId || !address) return;
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : [];
        const me = list.find((m: any) => m.user.address.toLowerCase() === address.toLowerCase());
        if (me) setMember({ id: me.id, name: me.name || "" });
      });
  }, [communityId, address]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member.id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/community/${communityId}/members/${member.id}/edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: member.name, address }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Error");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>User Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Display Name</label>
            <Input
              value={member.name}
              onChange={(e) => setMember({ ...member, name: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
