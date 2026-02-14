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
