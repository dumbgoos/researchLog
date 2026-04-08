import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createTestDatabase } from "../lib/test-db";

const databasePath = resolve(process.cwd(), "prisma", "e2e.db");

try {
  await rm(databasePath, { force: true });
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "EBUSY") {
    throw new Error("Could not reset prisma/e2e.db because it is locked. Stop any local Next.js dev server and retry.");
  }

  throw error;
}

createTestDatabase(databasePath);
