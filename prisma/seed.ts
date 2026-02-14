import { prisma } from "../src/lib/prisma";
import * as argon2 from "argon2";

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await argon2.hash("admin123");
  const admin = await prisma.userAccount.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@smarthome.local",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Created admin user:", admin.username);

  // Create regular user
  const userPassword = await argon2.hash("user123");
  const user = await prisma.userAccount.upsert({
    where: { username: "user" },
    update: {},
    create: {
      username: "user",
      email: "user@smarthome.local",
      password: userPassword,
      role: "USER",
      isActive: true,
    },
  });
  console.log("✅ Created regular user:", user.username);

  // Create home for regular user
  const userHome = await prisma.home.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "My Home",
      ownerUserId: user.id,
      addressText: "123 Main Street",
      city: "Jakarta",
      postalCode: "12345",
    },
  });
  console.log("✅ Created home for user:", userHome.name);

  // Create home for admin
  const adminHome = await prisma.home.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Admin Home",
      ownerUserId: admin.id,
      addressText: "456 Admin Avenue",
      city: "Jakarta",
      postalCode: "54321",
    },
  });
  console.log("✅ Created home for admin:", adminHome.name);

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
