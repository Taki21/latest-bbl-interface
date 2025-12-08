import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import {
  buildGenericSlug,
  buildValueSlug,
  countWords,
} from "@/lib/member-tags";

export async function POST(
  req: Request,
  { params }: { params: { communityId: string } }
) {
  const { communityId } = params;

  try {
    const body = await req.json();
    const label = String(body?.label ?? "").trim();
    const address = String(body?.address ?? "").trim();
    const mode = body?.mode === "generic" ? "generic" : "value";

    if (!label || !address) {
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

    const member = await prisma.member.findFirst({
      where: { communityId, userId: user.id },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (mode === "generic") {
      const slug = buildGenericSlug(label);
      const existing = await prisma.tag.findFirst({
        where: { communityId, slug },
      });
      if (existing) return NextResponse.json(safeJson(existing));
      const tag = await prisma.tag.create({
        data: { communityId, label, slug },
      });
      return NextResponse.json(safeJson(tag), { status: 201 });
    }

    const category = String(body?.category ?? "").trim();
    const type = String(body?.type ?? "").toUpperCase();
    const order = typeof body?.order === "number" ? body.order : undefined;

    if (!category || (type !== "LABEL" && type !== "DESC")) {
      return NextResponse.json(
        { error: "Invalid category or type" },
        { status: 400 }
      );
    }

    if (type === "DESC" && countWords(label) > 50) {
      return NextResponse.json(
        { error: "Descriptions are limited to 50 words" },
        { status: 400 }
      );
    }

    const slug = buildValueSlug({
      label,
      category,
      type,
      order,
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
  } catch (err) {
    console.error(
      "POST /api/community/[communityId]/member-tags/values error",
      err
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
