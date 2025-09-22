import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

const slugify = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await params;

  try {
    const tags = await prisma.tag.findMany({
      where: { communityId },
      orderBy: [{ label: "asc" }],
    });

    return NextResponse.json(safeJson(tags));
  } catch (err) {
    console.error("GET /api/community/[communityId]/tags error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await params;

  try {
    const { label, address } = await req.json();

    if (!label || typeof label !== "string" || !address || typeof address !== "string") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const cleanLabel = label.trim();
    const slug = slugify(cleanLabel);

    if (!cleanLabel || !slug) {
      return NextResponse.json({ error: "Invalid label" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { address },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, communityId },
      select: { id: true, role: true },
    });

    if (!member || (member.role !== MemberRole.Owner && member.role !== MemberRole.Supervisor)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const existing = await prisma.tag.findFirst({
      where: { communityId, slug },
    });
    if (existing) {
      return NextResponse.json(safeJson(existing));
    }

    const tag = await prisma.tag.create({
      data: {
        communityId,
        label: cleanLabel,
        slug,
      },
    });

    return NextResponse.json(safeJson(tag), { status: 201 });
  } catch (err) {
    console.error("POST /api/community/[communityId]/tags error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
