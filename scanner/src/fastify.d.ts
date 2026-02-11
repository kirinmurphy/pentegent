import type Database from "better-sqlite3";
import type { ScannerConfig } from "@pentegent/shared";

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
    config: ScannerConfig;
  }
}
