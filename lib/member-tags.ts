export type MemberProfileTagType = "LABEL" | "DESC";
export type MemberTagKind = "field" | "value" | "generic";

const MEMBER_FIELD_PREFIX = "member-field";
const MEMBER_VALUE_PREFIX = "member-value";
const MEMBER_GENERIC_PREFIX = "member-generic";
const END_TOKEN = "###END###";

const ORDER_REGEX = /^#ORDER_(\d+)#$/i;
const TYPE_REGEX = /^#TYPE_(LABEL|DESC)#$/i;
const CATEGORY_REGEX = /^#CATEGORY_([A-Z0-9_-]+)#$/i;

export interface ParsedMemberTagSlug {
  kind: MemberTagKind;
  order?: number;
  type?: MemberProfileTagType;
  category?: string;
  valueSlug?: string;
}

export const MAX_DESC_WORDS = 50;

export function slugifyLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCategory(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]+/g, "_");
}

function buildMetaSegments(meta: {
  order?: number;
  type?: MemberProfileTagType;
  category?: string;
}) {
  const segments: string[] = [];
  if (typeof meta.order === "number" && Number.isFinite(meta.order)) {
    segments.push(`#ORDER_${Math.max(0, Math.floor(meta.order))}#`);
  }
  if (meta.type) {
    segments.push(`#TYPE_${meta.type.toUpperCase()}#`);
  }
  if (meta.category) {
    segments.push(`#CATEGORY_${normalizeCategory(meta.category)}#`);
  }
  return segments;
}

function joinSegments(prefix: string, metaSegments: string[], label: string) {
  const labelSlug = slugifyLabel(label) || "tag";
  const metaPart = metaSegments.join("-");
  if (!metaPart) {
    return `${prefix}-${labelSlug}`;
  }
  return `${prefix}-${metaPart}-${END_TOKEN}-${labelSlug}`;
}

export function buildFieldSlug(meta: {
  order?: number;
  type: MemberProfileTagType;
  category: string;
  label: string;
}) {
  const segments = buildMetaSegments({
    order: meta.order,
    type: meta.type,
    category: meta.category,
  });
  return joinSegments(MEMBER_FIELD_PREFIX, segments, meta.label);
}

export function buildValueSlug(meta: {
  order?: number;
  type: MemberProfileTagType;
  category: string;
  label: string;
}) {
  const segments = buildMetaSegments({
    order: meta.order,
    type: meta.type,
    category: meta.category,
  });
  return joinSegments(MEMBER_VALUE_PREFIX, segments, meta.label);
}

export function buildGenericSlug(label: string) {
  const labelSlug = slugifyLabel(label) || "tag";
  return `${MEMBER_GENERIC_PREFIX}-${labelSlug}`;
}

export function parseMemberTagSlug(slug?: string | null): ParsedMemberTagSlug | null {
  if (!slug) return null;
  if (slug.startsWith(MEMBER_GENERIC_PREFIX)) {
    return {
      kind: "generic",
      valueSlug: slug.slice(MEMBER_GENERIC_PREFIX.length + 1) || undefined,
    };
  }

  let kind: MemberTagKind | null = null;
  let remainder = slug;
  if (slug.startsWith(MEMBER_FIELD_PREFIX)) {
    kind = "field";
    remainder = slug.slice(MEMBER_FIELD_PREFIX.length + 1);
  } else if (slug.startsWith(MEMBER_VALUE_PREFIX)) {
    kind = "value";
    remainder = slug.slice(MEMBER_VALUE_PREFIX.length + 1);
  }
  if (!kind) return null;

  const [metaPart = "", labelPart = ""] = remainder.split(`-${END_TOKEN}-`);
  const metaSegments = metaPart.split("-").filter(Boolean);

  let order: number | undefined;
  let type: MemberProfileTagType | undefined;
  let category: string | undefined;

  metaSegments.forEach((segment) => {
    const orderMatch = segment.match(ORDER_REGEX);
    if (orderMatch) {
      order = Number(orderMatch[1]);
      return;
    }
    const typeMatch = segment.match(TYPE_REGEX);
    if (typeMatch) {
      type = typeMatch[1].toUpperCase() as MemberProfileTagType;
      return;
    }
    const categoryMatch = segment.match(CATEGORY_REGEX);
    if (categoryMatch) {
      category = categoryMatch[1];
    }
  });

  return {
    kind,
    order,
    type,
    category,
    valueSlug: labelPart || undefined,
  };
}

export function formatCategoryLabel(value?: string | null) {
  if (!value) return "";
  const normalized = value.replace(/[_-]+/g, " ").toLowerCase();
  return normalized.replace(/(^|\s)\w/g, (match) => match.toUpperCase());
}

export function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
