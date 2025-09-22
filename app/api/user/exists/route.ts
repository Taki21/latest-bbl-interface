import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { userWithMembershipSelect } from "@/lib/prisma-user";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const address = searchParams.get("address");

    if (!email || !address) {
      return NextResponse.json(
        { error: "Missing query params: email and address are required" },
        { status: 400 }
      );
    }

    const userByEmail = await prisma.user.findUnique({
      where: { email },
      select: userWithMembershipSelect,
    });

    if (!userByEmail) {
      const userByAddress = await prisma.user.findUnique({
        where: { address },
        select: userWithMembershipSelect,
      });

      if (!userByAddress) {
        return NextResponse.json({ exists: false }, { status: 200 });
      }

      if (userByAddress.email !== email) {
        const updated = await prisma.user.update({
          where: { id: userByAddress.id },
          data: { email },
          select: userWithMembershipSelect,
        });

        return NextResponse.json(
          { exists: true, user: safeJson(updated) },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { exists: true, user: safeJson(userByAddress) },
        { status: 200 }
      );
    }

    if (userByEmail.address !== address) {
      const conflicting = await prisma.user.findUnique({
        where: { address },
        select: { id: true },
      });

      if (conflicting && conflicting.id !== userByEmail.id) {
        return NextResponse.json(
          { error: "Address already associated with another user" },
          { status: 409 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: userByEmail.id },
        data: { address },
        select: userWithMembershipSelect,
      });

      return NextResponse.json(
        { exists: true, user: safeJson(updatedUser) },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { exists: true, user: safeJson(userByEmail) },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/user/exists error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
