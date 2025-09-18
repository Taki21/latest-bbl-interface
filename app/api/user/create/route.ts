import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { userWithMembershipSelect } from "@/lib/prisma-user";

/**
 * =============================================================================
 *  POST /api/user/create
 *
 *  Body JSON → { name: string; email: string; address: string }
 *
 *  • Idempotently ensures a User exists for the provided email/address combo.
 *  • Updates name/address when the email already exists (e.g. wallet migrations).
 *  • Returns the User (with membership info) in BigInt-safe JSON.
 * =============================================================================
 */
export async function POST(req: Request) {
  try {
    const { name, email, address } = await req.json();

    if (!name || !email || !address) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, and address" },
        { status: 400 }
      );
    }

    const userByEmail = await prisma.user.findUnique({
      where: { email },
      select: userWithMembershipSelect,
    });

    if (userByEmail) {
      const needsAddressUpdate = userByEmail.address !== address;
      const needsNameUpdate = userByEmail.name !== name;

      if (needsAddressUpdate) {
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
      }

      if (needsAddressUpdate || needsNameUpdate) {
        const updated = await prisma.user.update({
          where: { id: userByEmail.id },
          data: {
            ...(needsAddressUpdate ? { address } : {}),
            ...(needsNameUpdate ? { name } : {}),
          },
          select: userWithMembershipSelect,
        });

        return NextResponse.json(safeJson(updated), { status: 200 });
      }

      return NextResponse.json(safeJson(userByEmail), { status: 200 });
    }

    const userByAddress = await prisma.user.findUnique({
      where: { address },
      select: userWithMembershipSelect,
    });

    if (userByAddress) {
      const updated = await prisma.user.update({
        where: { id: userByAddress.id },
        data: {
          name,
          email,
        },
        select: userWithMembershipSelect,
      });

      return NextResponse.json(safeJson(updated), { status: 200 });
    }

    const created = await prisma.user.create({
      data: {
        name,
        email,
        address,
        balance: BigInt(0),
      },
      select: userWithMembershipSelect,
    });

    return NextResponse.json(safeJson(created), { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Unique constraint violation" },
        { status: 409 }
      );
    }

    console.error("/api/user/create error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
