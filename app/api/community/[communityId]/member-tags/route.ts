import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";

import { prisma, safeJson } from "@/lib/prisma";
import {
  buildFieldSlug,
  buildGenericSlug,
  parseMemberTagSlug,
  type MemberProfileTagType,
} from "@/lib/member-tags";

interface DefinitionResponse {
  id: string;
  label: string;
  slug: string;
  order?: number | null;
  type?: MemberProfileTagType | null;
  category?: string | null;
  values: {
    id: string;
    label: string;
    slug: string;
  }[];
}

export async function GET(
  _req: Request,
  { params }: { params: { communityId: string } }
) {
  const { communityId } = params;

  try {
    const [fieldTags, valueTags, genericTags] = await Promise.all([
      prisma.tag.findMany({
        where: { communityId, slug: { startsWith: "member-field" } },
        orderBy: [{ label: "asc" }],
      }),
      prisma.tag.findMany({
        where: { communityId, slug: { startsWith: "member-value" } },
        orderBy: [{ label: "asc" }],
      }),
      prisma.tag.findMany({
        where: { communityId, slug: { startsWith: "member-generic" } },
        orderBy: [{ label: "asc" }],
      }),
    ]);

    const valuesByCategory = new Map<string, { id: string; label: string; slug: string }[]>();
    valueTags.forEach((tag) => {
      const meta = parseMemberTagSlug(tag.slug);
      if (!meta?.category) return;
      const bucket = valuesByCategory.get(meta.category) ?? [];
      bucket.push({ id: tag.id, label: tag.label, slug: tag.slug });
      valuesByCategory.set(meta.category, bucket);
    });

    const definitions: DefinitionResponse[] = fieldTags
      .map((tag) => {
        const meta = parseMemberTagSlug(tag.slug);
        if (!meta) return null;
        return {
          id: tag.id,
          label: tag.label,
          slug: tag.slug,
          order: meta.order ?? null,
          type: meta.type ?? null,
          category: meta.category ?? null,
          values: meta.category ? valuesByCategory.get(meta.category) ?? [] : [],
        } satisfies DefinitionResponse;
      })
      .filter((value): value is DefinitionResponse => Boolean(value));

    const generics = genericTags.map((tag) => ({
      id: tag.id,
      label: tag.label,
      slug: tag.slug,
    }));

    return NextResponse.json(safeJson({ fields: definitions, generics }));
  } catch (err) {
    console.error("GET /api/community/[communityId]/member-tags error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { communityId: string } }
) {
  const { communityId } = params;

  try {
    const body = await req.json();
    const mode = body?.mode as "field" | "generic";
    const label = String(body?.label ?? "").trim();
    const address = String(body?.address ?? "").trim();

    if (!label || !address || !mode) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { address },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const caller = await prisma.member.findFirst({
      where: { userId: user.id, communityId },
      select: { id: true, role: true },
    });
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isAdmin =
      caller.role === MemberRole.Owner || caller.role === MemberRole.Supervisor;
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (mode === "field") {
      const category = String(body?.category ?? "").trim();
      const type = String(body?.type ?? "").toUpperCase() as MemberProfileTagType;
      const order = body?.order;
      if (!category || (type !== "LABEL" && type !== "DESC")) {
        return NextResponse.json(
          { error: "Missing category or type" },
          { status: 400 }
        );
      }

      const slug = buildFieldSlug({
        label,
        category,
        type,
        order: typeof order === "number" ? order : undefined,
      });

      const existing = await prisma.tag.findFirst({
        where: { communityId, slug },
      });
      if (existing) {
        return NextResponse.json(safeJson(existing));
      }

      const tag = await prisma.tag.create({
        data: {
          communityId,
          label,
          slug,
        },
      });
      return NextResponse.json(safeJson(tag), { status: 201 });
    }

    if (mode === "generic") {
      const slug = buildGenericSlug(label);
      const existing = await prisma.tag.findFirst({
        where: { communityId, slug },
      });
      if (existing) {
        return NextResponse.json(safeJson(existing));
      }
      const tag = await prisma.tag.create({
        data: { communityId, label, slug },
      });
      return NextResponse.json(safeJson(tag), { status: 201 });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/community/[communityId]/member-tags error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
