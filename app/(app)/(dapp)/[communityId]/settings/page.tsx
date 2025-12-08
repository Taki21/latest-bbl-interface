"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  countWords,
  formatCategoryLabel,
  parseMemberTagSlug,
} from "@/lib/member-tags";

interface MemberTagLink {
  id: string;
  tag: { id: string; label: string; slug: string };
}

interface MemberRecord {
  id: string;
  name: string;
  memberTags: MemberTagLink[];
}

interface ProfileField {
  id: string;
  label: string;
  slug: string;
  order?: number | null;
  type?: "LABEL" | "DESC" | null;
  category?: string | null;
  values: { id: string; label: string; slug: string }[];
}

interface GenericTag {
  id: string;
  label: string;
  slug: string;
}

export default function SettingsPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address } = useAccount();

  const [member, setMember] = useState<MemberRecord>({
    id: "",
    name: "",
    memberTags: [],
  });
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fields, setFields] = useState<ProfileField[]>([]);
  const [generics, setGenerics] = useState<GenericTag[]>([]);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [selectedGenerics, setSelectedGenerics] = useState<string[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePrefilled, setProfilePrefilled] = useState(false);

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
        const me = list.find((m: any) => m.user.address?.toLowerCase() === address.toLowerCase());
        if (me) {
          setMember({
            id: me.id,
            name: me.name || "",
            memberTags: Array.isArray(me.memberTags) ? me.memberTags : [],
          });
        }
      });
  }, [communityId, address]);

  const loadDefinitions = () => {
    if (!communityId) return;
    fetch(`/api/community/${communityId}/member-tags`)
      .then((res) => res.json())
      .then((defs) => {
        setFields(Array.isArray(defs?.fields) ? defs.fields : []);
        setGenerics(Array.isArray(defs?.generics) ? defs.generics : []);
      })
      .catch(() => setProfileError("Failed to load profile fields"));
  };

  useEffect(loadDefinitions, [communityId]);

  useEffect(() => {
    if (profilePrefilled) return;
    if (!member.memberTags?.length) {
      setProfileValues({});
      setSelectedGenerics([]);
      setProfilePrefilled(true);
      return;
    }
    const values: Record<string, string> = {};
    const genericIds: string[] = [];
    member.memberTags.forEach((link) => {
      const meta = parseMemberTagSlug(link.tag.slug);
      if (meta?.kind === "value" && meta.category) {
        values[meta.category] = link.tag.label;
      } else if (link.tag.id) {
        genericIds.push(link.tag.id);
      }
    });
    setProfileValues(values);
    setSelectedGenerics(genericIds);
    setProfilePrefilled(true);
  }, [member.memberTags, profilePrefilled]);

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member.id) return;
    setSavingName(true);
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
      setSavingName(false);
    }
  };

  const handleValueChange = (category: string, value: string) => {
    setProfileValues((prev) => ({ ...prev, [category]: value }));
  };

  const toggleGeneric = (id: string) => {
    setSelectedGenerics((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const sortedFields = useMemo(() => {
    return [...fields].sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a.label || "").localeCompare(b.label || "");
    });
  }, [fields]);

  const ensureMemberTagsRefreshed = async () => {
    if (!communityId || !member.id) return;
    const res = await fetch(
      `/api/community/${communityId}/members/${member.id}/member-tags`
    );
    if (res.ok) {
      const data = await res.json();
      setMember((prev) => ({
        ...prev,
        memberTags: Array.isArray(data?.memberTags) ? data.memberTags : [],
      }));
      setProfilePrefilled(false);
    }
  };

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!communityId || !member.id || !address) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const tagIds: string[] = [];

      for (const field of sortedFields) {
        const key = field.category || field.id;
        const raw = profileValues[key]?.trim();
        if (!raw) continue;
        if (field.type === "DESC" && countWords(raw) > 50) {
          throw new Error("Descriptions must be 50 words or fewer");
        }
        const res = await fetch(
          `/api/community/${communityId}/member-tags/values`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "value",
              label: raw,
              category: field.category || key,
              type: field.type || "LABEL",
              order: typeof field.order === "number" ? field.order : undefined,
              address,
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to save field");
        }
        const created = await res.json();
        tagIds.push(created.id);
      }

      selectedGenerics.forEach((id) => tagIds.push(id));

      const res = await fetch(
        `/api/community/${communityId}/members/${member.id}/member-tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagIds, address }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile");
      }

      setProfileMessage("Profile updated");
      await ensureMemberTagsRefreshed();
      loadDefinitions();
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Display Name</label>
              <Input
                value={member.name}
                onChange={(e) => setMember((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={savingName}>
              {savingName ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleProfileSave} className="space-y-6">
            {sortedFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Admins haven’t configured profile fields yet. Visit the Admin page to add them.
              </p>
            ) : (
              sortedFields.map((field) => {
                const key = field.category || field.id;
                const value = profileValues[key] ?? "";
                const suggestions = field.values || [];
                const label = field.label || formatCategoryLabel(field.category);
                const isDesc = field.type === "DESC";
                const words = value ? countWords(value) : 0;
                return (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{label}</label>
                      {field.type && (
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                      )}
                    </div>
                    {isDesc ? (
                      <Textarea
                        value={value}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        placeholder={`Enter up to 50 words about your ${label?.toLowerCase()}`}
                        rows={4}
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        placeholder={`Add your ${label?.toLowerCase()}`}
                      />
                    )}
                    {isDesc && (
                      <p className={`text-xs ${words > 50 ? "text-destructive" : "text-muted-foreground"}`}>
                        {words} / 50 words
                      </p>
                    )}
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleValueChange(key, option.label)}
                            className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {generics.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Generic Tags</p>
                <div className="flex flex-wrap gap-2">
                  {generics.map((tag) => {
                    const active = selectedGenerics.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleGeneric(tag.id)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            {profileMessage && <p className="text-sm text-green-600">{profileMessage}</p>}

            <Button type="submit" disabled={profileSaving || !member.id} className="w-full">
              {profileSaving ? "Saving profile…" : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
