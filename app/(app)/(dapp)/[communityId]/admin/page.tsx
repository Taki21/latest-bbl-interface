"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCategoryLabel } from "@/lib/member-tags";

interface ProfileField {
  id: string;
  label: string;
  slug: string;
  order?: number | null;
  type?: "LABEL" | "DESC" | null;
  category?: string | null;
  values: { id: string; label: string; slug: string }[];
}

interface MemberTagDefinitionResponse {
  fields: ProfileField[];
  generics: { id: string; label: string; slug: string }[];
}

export default function CommunityAdminPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address } = useAccount();

  const [role, setRole] = useState<string | null>(null);
  const [fields, setFields] = useState<ProfileField[]>([]);
  const [generics, setGenerics] = useState<{ id: string; label: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldCategory, setFieldCategory] = useState("");
  const [fieldOrder, setFieldOrder] = useState("");
  const [fieldType, setFieldType] = useState<"LABEL" | "DESC" | "">("");
  const [creatingField, setCreatingField] = useState(false);

  const [genericLabel, setGenericLabel] = useState("");
  const [creatingGeneric, setCreatingGeneric] = useState(false);

  const isAdmin = role === "Owner" || role === "Supervisor";

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/community/${communityId}/member-tags`).then((res) => res.json()),
      fetch(`/api/community/${communityId}/members`).then((res) => res.json()),
    ])
      .then(([definitions, members]) => {
        const parsed = Array.isArray(definitions?.fields)
          ? (definitions as MemberTagDefinitionResponse)
          : { fields: [], generics: [] };
        setFields(parsed.fields);
        setGenerics(parsed.generics);

        const list = Array.isArray(members)
          ? members
          : Array.isArray(members?.members)
          ? members.members
          : [];
        const me = list.find((m: any) =>
          m.user.address?.toLowerCase() === address?.toLowerCase()
        );
        setRole(me?.role ?? null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load member tags");
      })
      .finally(() => setLoading(false));
  }, [communityId, address]);

  const sortedFields = useMemo(() => {
    return [...fields].sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    });
  }, [fields]);

  const refreshDefinitions = () => {
    if (!communityId) return;
    fetch(`/api/community/${communityId}/member-tags`)
      .then((res) => res.json())
      .then((defs: MemberTagDefinitionResponse) => {
        setFields(Array.isArray(defs.fields) ? defs.fields : []);
        setGenerics(Array.isArray(defs.generics) ? defs.generics : []);
      })
      .catch(() => setError("Failed to refresh tags"));
  };

  const handleCreateField = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!communityId || !address || !fieldLabel.trim() || !fieldCategory.trim() || !fieldType) {
      setError("Fill out all field inputs");
      return;
    }
    setCreatingField(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/${communityId}/member-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "field",
          label: fieldLabel.trim(),
          category: fieldCategory.trim(),
          order: fieldOrder ? Number(fieldOrder) : undefined,
          type: fieldType,
          address,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create field");
      }
      setFieldLabel("");
      setFieldCategory("");
      setFieldOrder("");
      setFieldType("");
      refreshDefinitions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingField(false);
    }
  };

  const handleCreateGeneric = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!communityId || !address || !genericLabel.trim()) {
      setError("Label is required");
      return;
    }
    setCreatingGeneric(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/${communityId}/member-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generic",
          label: genericLabel.trim(),
          address,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create tag");
      }
      setGenericLabel("");
      refreshDefinitions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingGeneric(false);
    }
  };

  if (loading) return <p className="p-4">Loading admin settings…</p>;

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure profile fields and member tags for this community.</p>
      </div>

      {!isAdmin && (
        <Card className="border-amber-300 bg-amber-50 text-amber-900">
          <CardHeader>
            <CardTitle>Read-only access</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only community Owners and Supervisors can create or edit member tag definitions.</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create profile field</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateField} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Display label</label>
                <Input
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g. Major"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category code</label>
                <Input
                  value={fieldCategory}
                  onChange={(e) => setFieldCategory(e.target.value)}
                  placeholder="e.g. MAJOR"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used in slugs and grouping. Uppercase letters, numbers, and underscores only.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Display order</label>
                  <Input
                    type="number"
                    min={1}
                    value={fieldOrder}
                    onChange={(e) => setFieldOrder(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={fieldType} onValueChange={(value) => setFieldType(value as any)} disabled={!isAdmin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LABEL">Label (short text)</SelectItem>
                      <SelectItem value="DESC">Description (up to 50 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={!isAdmin || creatingField} className="w-full">
                {creatingField ? "Creating…" : "Add Field"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create generic tag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGeneric} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={genericLabel}
                  onChange={(e) => setGenericLabel(e.target.value)}
                  placeholder="e.g. Solidity"
                  disabled={!isAdmin}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Generic tags are simple labels members can toggle on their profile.
              </p>
              <Button type="submit" disabled={!isAdmin || creatingGeneric} className="w-full">
                {creatingGeneric ? "Creating…" : "Add Tag"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured profile fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No profile fields yet.</p>
          ) : (
            sortedFields.map((field) => (
              <div key={field.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Category: {formatCategoryLabel(field.category) || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {typeof field.order === "number" && <span>Order {field.order}</span>}
                    {field.type && <Badge variant="outline">{field.type}</Badge>}
                  </div>
                </div>
                {field.values.length ? (
                  <div className="flex flex-wrap gap-2">
                    {field.values.map((value) => (
                      <Badge key={value.id} variant="secondary">
                        {value.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No member-entered values yet.</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generic tags</CardTitle>
        </CardHeader>
        <CardContent>
          {generics.length ? (
            <div className="flex flex-wrap gap-2">
              {generics.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.label}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No generic tags available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
