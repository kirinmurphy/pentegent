import Fastify from "fastify";
import { loadConfig } from "./config.js";
import { createDatabase } from "./db/connection.js";
import { migrate } from "./db/migrate.js";
import { seed } from "./db/seed.js";
import { reconcileStaleJobs } from "./worker/reconcile.js";
import { startWorker } from "./worker/worker.js";
import { healthRoutes } from "./routes/health.js";
import { scanRoutes } from "./routes/scan.js";
import { jobsRoutes } from "./routes/jobs.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config.dbPath);

  migrate(db);
  console.log("Migrated");

  seed(db);
  console.log("Seeded");

  reconcileStaleJobs(db, config.staleHeartbeatThresholdMs);

  const app = Fastify({ logger: true });
  app.decorate("db", db);
  app.decorate("config", config);

  await app.register(healthRoutes);
  await app.register(scanRoutes);
  await app.register(jobsRoutes);

  startWorker(db, config);

  await app.listen({ port: config.port, host: config.host });
  console.log(`Server listening on ${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
