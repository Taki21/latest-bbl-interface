// Shared Prisma select helpers for User queries
export const userWithMembershipSelect = {
  id: true,
  name: true,
  email: true,
  address: true,
  members: {
    select: {
      id: true,
      allocation: true,
      role: true,
      community: {
        select: { id: true, name: true, joinCode: true },
      },
    },
  },
} as const;
