// Helper RBAC dasar (NFR-004). Otorisasi endpoint memeriksa role dari
// session user — implementasi session mengikuti keputusan DEC-03.
export interface RoleLike {
  key: string;
}

export function hasRole(roles: RoleLike[], key: string): boolean {
  return roles.some((role) => role.key === key);
}

export function hasAnyRole(roles: RoleLike[], keys: string[]): boolean {
  return keys.some((key) => hasRole(roles, key));
}
