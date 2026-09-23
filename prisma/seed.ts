import { PrismaClient, Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_LAYOUT } from "../src/contexts/project/project-utils";

const prisma = new PrismaClient();

/**
 * A handful of real building shapes over Jakarta, for dev/CI to exercise
 * MC-051 against. The actual Microsoft Building Footprints import (millions
 * of rows, hours to run) is a separate one-off script — see
 * scripts/import-building-footprints.mjs — never part of seeding, and never
 * runs in production anyway since this whole script refuses to.
 */
async function seedSampleBuildingFootprints() {
  const existing = await prisma.buildingFootprint.count();
  if (existing > 0) return;

  const fixturePath = path.join(__dirname, "..", "examples", "sample-building-footprints.geojsonl");
  const lines = readFileSync(fixturePath, "utf8").split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const feature = JSON.parse(line);
    await prisma.$executeRaw`
      INSERT INTO "BuildingFootprint" (id, source, properties, geom)
      VALUES (
        gen_random_uuid()::text,
        'ms-building-footprints',
        ${JSON.stringify(feature.properties ?? {})}::jsonb,
        ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 4326), 3857)
      )
    `;
  }
  console.log(`seeded ${lines.length} sample building footprint(s)`);
}

/**
 * Creates the one account that can sign in (MC-043).
 *
 * Refuses to run in production. A seeded account with a known password is
 * exactly what a scanner looks for, so a real deployment must create its admin
 * deliberately rather than inherit this one.
 */
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to seed in production: this creates an account with a known password."
    );
  }

  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.admin },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: Role.admin,
      guidanceDismissed: false,
    },
  });

  console.log(`seeded admin: ${user.email} (role ${user.role})`);
  if (password === "admin") {
    console.log("password is the default 'admin' — set SEED_ADMIN_PASSWORD to change it");
  }

  const existingProject = await prisma.project.findFirst({ where: { userId: user.id } });
  if (!existingProject) {
    await prisma.project.create({
      data: {
        userId: user.id,
        name: "Untitled project",
        layout: DEFAULT_LAYOUT as unknown as Prisma.InputJsonValue,
      },
    });
    console.log("seeded the admin's one project");
  }

  await seedSampleBuildingFootprints();
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
