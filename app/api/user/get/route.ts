// File: app/api/user/get/route.ts

import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { error: "Missing query param: address" },
        { status: 400 }
      );
    }

    // Fetch the user and _all_ their Member records (including allocation & role)
    const user = await prisma.user.findUnique({
      where: { address },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        members: {
          select: {
            id:         true,
            allocation: true,
            role:       true,
            community: {
              select: { id: true, name: true, joinCode: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return with safeJson so BigInt -> string for JSON
    return NextResponse.json(safeJson(user), { status: 200 });
  } catch (err) {
    console.error("GET /api/user/get error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
