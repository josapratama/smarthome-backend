import type { UserAccount, Home } from "../../lib/generated/prisma/client"; //

export function toUserDTO(u: UserAccount) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toHomeDTO(h: Home) {
  return {
    id: h.id,
    name: h.name,
    ownerUserId: h.ownerUserId,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}
