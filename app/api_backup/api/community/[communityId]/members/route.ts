import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: { communityId: string } }
) {
  try {
    const { communityId } = ctx.params;

    // Fetch members, their user, and their allocations
    const members = await prisma.member.findMany({
      where: { communityId },
      include: {
        user: {
          select: { id: true, name: true, address: true, email: true },
        },
        allocations: {
          select: { amount: true },
        },
      },
      orderBy: { role: "asc" },
    });

    // For each member compute the sum of their allocations
    const formatted = members.map((m) => {
      const allocatedSum = m.allocations.reduce(
        (sum, a) => sum + a.amount,
        BigInt(0)
      );
      return {
        id: m.id,
        role: m.role,
        balance: m.balance,         // BigInt
        allocated: allocatedSum,    // BigInt
        user: m.user,
      };
    });

    return NextResponse.json(safeJson(formatted));
  } catch (err) {
    console.error("GET members error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
