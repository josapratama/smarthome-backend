import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../lib/generated/prisma/client";

type AuthUser = { id: number; role: "USER" | "ADMIN" };

export async function listHomes(
  auth: AuthUser,
  filters: {
    ownerId?: number;
    ownerEmail?: string;
    city?: string;
    limit?: number;
    cursor?: number;
  },
) {
  const take = Math.min(Math.max(filters.limit ?? 20, 1), 100);
  const cursor = filters.cursor;

  const whereUser: Prisma.HomeWhereInput = {
    deletedAt: null,
    ...(filters.city ? { city: filters.city } : {}),
    OR: [
      { ownerUserId: auth.id },
      {
        members: {
          some: { userId: auth.id, status: "ACTIVE", deletedAt: null },
        },
      },
    ],
  };

  const whereAdmin: Prisma.HomeWhereInput = {
    deletedAt: null,
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.ownerId || filters.ownerEmail
      ? {
          ownerUserId: filters.ownerId ?? undefined,
          owner: filters.ownerEmail ? { email: filters.ownerEmail } : undefined,
        }
      : {}),
  };

  const where: Prisma.HomeWhereInput =
    auth.role === "ADMIN" ? whereAdmin : whereUser;

  const homes = await prisma.home.findMany({
    where,
    take: take + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const hasNext = homes.length > take;
  const items = hasNext ? homes.slice(0, take) : homes;
  const nextCursor = hasNext ? items[items.length - 1]!.id : null;

  return { homes: items, nextCursor };
}

export async function createHome(
  auth: AuthUser,
  input: {
    name: string;
    ownerUserId: number;
    addressText?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  // USER hanya boleh bikin home untuk dirinya sendiri
  if (auth.role !== "ADMIN" && input.ownerUserId !== auth.id) {
    return { error: "FORBIDDEN" as const };
  }

  const owner = await prisma.userAccount.findUnique({
    where: { id: input.ownerUserId },
  });
  if (!owner) return { error: "OWNER_NOT_FOUND" as const };

  const home = await prisma.home.create({
    data: {
      name: input.name,
      ownerUserId: input.ownerUserId,
      addressText: input.addressText ?? undefined,
      city: input.city ?? undefined,
      postalCode: input.postalCode ?? undefined,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
    },
  });

  return { home };
}

async function canAccessHome(auth: AuthUser, homeId: number) {
  if (auth.role === "ADMIN") return true;

  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      deletedAt: null,
      OR: [
        { ownerUserId: auth.id },
        {
          members: {
            some: { userId: auth.id, status: "ACTIVE", deletedAt: null },
          },
        },
      ],
    },
    select: { id: true },
  });

  return !!home;
}

async function canManageHome(auth: AuthUser, homeId: number) {
  // manage = update/delete/restore: admin atau owner saja
  if (auth.role === "ADMIN") return true;

  const home = await prisma.home.findFirst({
    where: { id: homeId, ownerUserId: auth.id },
    select: { id: true },
  });

  return !!home;
}

export async function getHomeById(auth: AuthUser, homeId: number) {
  const ok = await canAccessHome(auth, homeId);
  if (!ok) return { error: "NOT_FOUND" as const }; // sengaja NOT_FOUND biar tidak bocor info

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  return { home };
}

export async function updateHome(
  auth: AuthUser,
  homeId: number,
  input: {
    name?: string;
    ownerUserId?: number;
    addressText?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  const can = await canManageHome(auth, homeId);
  if (!can)
    return {
      error:
        auth.role === "ADMIN" ? ("NOT_FOUND" as const) : ("FORBIDDEN" as const),
    };

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  // hanya ADMIN yang boleh pindah owner
  if (input.ownerUserId != null && auth.role !== "ADMIN") {
    return { error: "FORBIDDEN" as const };
  }

  if (input.ownerUserId != null) {
    const owner = await prisma.userAccount.findUnique({
      where: { id: input.ownerUserId },
    });
    if (!owner) return { error: "OWNER_NOT_FOUND" as const };
  }

  const updated = await prisma.home.update({
    where: { id: homeId },
    data: {
      name: input.name ?? undefined,
      ownerUserId: input.ownerUserId ?? undefined,
      addressText: input.addressText ?? undefined,
      city: input.city ?? undefined,
      postalCode: input.postalCode ?? undefined,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
    },
  });

  return { home: updated };
}

export async function deleteHome(auth: AuthUser, homeId: number) {
  const can = await canManageHome(auth, homeId);
  if (!can)
    return {
      error:
        auth.role === "ADMIN" ? ("NOT_FOUND" as const) : ("FORBIDDEN" as const),
    };

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  await prisma.home.update({
    where: { id: homeId },
    data: { deletedAt: new Date() },
  });

  return { ok: true as const };
}

export async function restoreHome(auth: AuthUser, homeId: number) {
  const can = await canManageHome(auth, homeId);
  if (!can)
    return {
      error:
        auth.role === "ADMIN" ? ("NOT_FOUND" as const) : ("FORBIDDEN" as const),
    };

  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: { not: null } },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  const updated = await prisma.home.update({
    where: { id: homeId },
    data: { deletedAt: null },
  });

  return { home: updated };
}

export async function transferOwnership(
  auth: AuthUser,
  homeId: number,
  newOwnerUserId: number,
) {
  // home must exist (including active only)
  const home = await prisma.home.findFirst({
    where: { id: homeId, deletedAt: null },
    select: {
      id: true,
      ownerUserId: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!home) return { error: "NOT_FOUND" as const };

  // only admin or current owner
  if (auth.role !== "ADMIN" && auth.id !== home.ownerUserId) {
    return { error: "FORBIDDEN" as const };
  }

  // new owner must exist
  const newOwner = await prisma.userAccount.findUnique({
    where: { id: newOwnerUserId },
    select: { id: true },
  });
  if (!newOwner) return { error: "OWNER_NOT_FOUND" as const };

  // transaction: update owner + ensure membership
  const updated = await prisma.$transaction(async (tx) => {
    // set new owner
    const h = await tx.home.update({
      where: { id: homeId },
      data: { ownerUserId: newOwnerUserId },
    });

    // ensure new owner is ACTIVE member (optional but useful)
    const existing = await tx.homeMember.findFirst({
      where: { homeId, userId: newOwnerUserId },
    });

    if (existing) {
      await tx.homeMember.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          status: "ACTIVE",
          joinedAt: existing.joinedAt ?? new Date(),
          roleInHome: "OWNER", // membership role purely informational
        },
      });
    } else {
      await tx.homeMember.create({
        data: {
          homeId,
          userId: newOwnerUserId,
          roleInHome: "OWNER",
          status: "ACTIVE",
          invitedAt: new Date(),
          joinedAt: new Date(),
        },
      });
    }

    // optional: demote old owner membership to MEMBER (if exists)
    const oldMember = await tx.homeMember.findFirst({
      where: { homeId, userId: home.ownerUserId },
    });
    if (oldMember) {
      await tx.homeMember.update({
        where: { id: oldMember.id },
        data: {
          deletedAt: null,
          status: "ACTIVE",
          roleInHome: "MEMBER",
          joinedAt: oldMember.joinedAt ?? new Date(),
        },
      });
    }

    return h;
  });

  return { home: updated };
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

export async function listNearbyHomes(
  auth: AuthUser,
  input: { lat: number; lng: number; radiusKm: number; limit: number },
) {
  const { lat, lng, radiusKm, limit } = input;

  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos(toRad(lat)));

  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  const minLng = lng - lngDelta;
  const maxLng = lng + lngDelta;

  const scopeWhere: Prisma.HomeWhereInput =
    auth.role === "ADMIN"
      ? {}
      : {
          OR: [
            { ownerUserId: auth.id },
            {
              members: {
                some: {
                  userId: auth.id,
                  status: "ACTIVE",
                  deletedAt: null,
                },
              },
            },
          ],
        };

  const candidates = await prisma.home.findMany({
    where: {
      deletedAt: null,
      latitude: { not: null, gte: minLat, lte: maxLat },
      longitude: { not: null, gte: minLng, lte: maxLng },
      ...scopeWhere,
    },
    take: Math.min(limit * 5, 500),
    orderBy: [{ createdAt: "desc" }],
  });

  const center = { lat, lng };

  const filtered = candidates
    .map((h) => ({
      h,
      d: haversineKm(center, { lat: h.latitude!, lng: h.longitude! }),
    }))
    .filter((x) => x.d <= radiusKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.h);

  return { homes: filtered };
}
