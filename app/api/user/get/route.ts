// File: app/api/user/get/route.ts

import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { userWithMembershipSelect } from "@/lib/prisma-user";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const email = searchParams.get("email");

    if (!address && !email) {
      return NextResponse.json(
        { error: "Missing query param: address or email" },
        { status: 400 }
      );
    }

    let user = null;

    if (address) {
      user = await prisma.user.findUnique({
        where: { address },
        select: userWithMembershipSelect,
      });
    }

    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: userWithMembershipSelect,
      });
    }

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
