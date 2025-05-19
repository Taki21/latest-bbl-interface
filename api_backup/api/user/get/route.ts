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

    // Fetch user along with their member-community relations
    const user = await prisma.user.findUnique({
      where: { address },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        members: {
          select: {
            community: {
              select: {
                id: true,
                name: true,
                joinCode: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract the array of communities
    const communities = user.members.map((m) => m.community);

    return NextResponse.json(
      safeJson({
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        communities,
      })
    );
  } catch (err) {
    console.error("GET /api/user/get error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
