import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createTestDatabase } from "../lib/test-db";

const databasePath = resolve(process.cwd(), "prisma", "e2e.db");

await rm(databasePath, { force: true });
createTestDatabase(databasePath);
