import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
    process.exit(1);
  }

  // Seed admin user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists, skipping.`);
  } else {
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash: hashSync(password, 12),
        firstName: "Admin",
        lastName: "System",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`Created admin user: ${admin.email} (${admin.id})`);
  }

  // Seed default disciplines
  const disciplines = [
    "Informatica",
    "Italiano - Storia",
    "TLC",
    "Religione",
    "TPSIT",
    "Sistemi e Reti",
    "Matematica - Complemento",
    "Inglese",
    "Scienze Motorie e Sportive",
    "Sistemi e Reti - Lab.",
    "INF - Lab.",
    "TPSIT - Lab.",
    "TLC - Lab.",
  ];

  let created = 0;
  for (const name of disciplines) {
    const exists = await prisma.discipline.findUnique({ where: { name } });
    if (!exists) {
      await prisma.discipline.create({ data: { name } });
      created++;
    }
  }
  console.log(`Disciplines: ${created} created, ${disciplines.length - created} already existed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
