"use client";

import * as React from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { formatCategoryLabel, parseMemberTagSlug } from "@/lib/member-tags";

interface MemberTagLink {
  id: string;
  tag: { id: string; label: string; slug: string };
}

interface MemberProfile {
  id: string;
  name?: string | null;
  role?: string | null;
  user?: { name: string | null; address: string };
  memberTags?: MemberTagLink[];
}

interface Props {
  member?: MemberProfile | null;
  children: React.ReactElement;
}

const shortenAddress = (value?: string | null) => {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export function MemberProfileHover({ member, children }: Props) {
  if (!member) return children;

  const displayName = member.name || member.user?.name || member.user?.address || "Member";
  const address = member.user?.address;

  const structured = React.useMemo(() => {
    const labels: { category: string; value: string }[] = [];
    const descriptions: { category: string; value: string }[] = [];
    const generic: string[] = [];

    (member.memberTags || []).forEach((link) => {
      const meta = parseMemberTagSlug(link.tag.slug);
      if (meta?.kind === "value" && meta.category) {
        const entry = { category: formatCategoryLabel(meta.category), value: link.tag.label };
        if (meta.type === "DESC") descriptions.push(entry);
        else labels.push(entry);
      } else {
        generic.push(link.tag.label);
      }
    });

    return { labels, descriptions, generic };
  }, [member.memberTags]);

  if (!structured.labels.length && !structured.descriptions.length && !structured.generic.length && !address) {
    return children;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="space-y-3">
        <div>
          <p className="font-semibold leading-tight">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {member.role ? `${member.role} • ` : null}
            {address ? shortenAddress(address) : "Member"}
          </p>
        </div>

        {structured.labels.length > 0 && (
          <div className="space-y-1">
            {structured.labels.map((item, index) => (
              <div key={`${item.category}-${index}`} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.category || "Detail"}</span>
                <span className="font-medium text-right">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {structured.descriptions.length > 0 && (
          <div className="space-y-1">
            {structured.descriptions.map((item, index) => (
              <p key={`${item.category}-${index}`} className="text-xs">
                <span className="text-muted-foreground">{item.category || "About"}: </span>
                {item.value}
              </p>
            ))}
          </div>
        )}

        {structured.generic.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {structured.generic.map((label, index) => (
              <Badge key={`${label}-${index}`} variant="secondary" className="text-[10px]">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
