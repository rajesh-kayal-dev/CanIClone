import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // Migrations/CLI use the DIRECT_URL (non-pooler) Neon endpoint so that
    // sessions and DDL (shadow DB, CREATE EXTENSION, ALTER TABLE) work.
    // The application runtime keeps using the pooled DATABASE_URL.
    url: env("DIRECT_URL"),
  },
});