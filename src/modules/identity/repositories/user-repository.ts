// Repository = satu-satunya tempat yang menyentuh Prisma untuk domain ini.
// Service (nanti) memanggil repository; API route memanggil service.
import { db } from "@/infrastructure/db";
import type { UserDto } from "@/shared/types/api";

export async function listUsers(): Promise<UserDto[]> {
  const users = await db.user.findMany({
    include: { roles: { include: { role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    roles: user.roles.map((userRole) => ({ key: userRole.role.key, name: userRole.role.name })),
    createdAt: user.createdAt.toISOString(),
  }));
}
