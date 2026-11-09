export const userRoles = {
  student: "STUDENT",
  admin: "ADMIN",
} as const;

export type UserRole = (typeof userRoles)[keyof typeof userRoles];

export function canAccessCourse(role: UserRole, isPremium: boolean) {
  if (role === userRoles.admin) return true;
  return isPremium;
}

export function hasAdminAccess(role: UserRole) {
  return role === userRoles.admin;
}
