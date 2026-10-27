// Repository = satu-satunya tempat yang menyentuh Prisma untuk domain ini.
// Service (nanti) memanggil repository; API route memanggil service.
import { db } from "@/infrastructure/db";
import type { ListQuery, ListMeta, UserDto } from "@/shared/types/api";

export interface UserListFilters {
  /** Pencarian bebas pada name/email. */
  q?: string;
  isActive?: boolean;
}

export type UserSortField = "createdAt" | "name" | "email";

export async function listUsers(
  query: ListQuery<UserSortField>,
  filters: UserListFilters,
): Promise<{ data: UserDto[]; meta: ListMeta }> {
  const where = {
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { email: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
  };

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: { roles: { include: { role: true } } },
      orderBy: { [query.sort.field]: query.sort.direction },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      roles: user.roles.map((userRole) => ({ key: userRole.role.key, name: userRole.role.name })),
      createdAt: user.createdAt.toISOString(),
    })),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}
