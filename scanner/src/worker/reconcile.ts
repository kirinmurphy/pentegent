import type Database from "better-sqlite3";
import { markStaleJobsAsFailed } from "../services/job-service.js";

export function reconcileStaleJobs(
  db: Database.Database,
  thresholdMs: number,
): void {
  const count = markStaleJobsAsFailed(db, thresholdMs);
  if (count > 0) {
    console.log(`Reconciled ${count} stale running job(s) as FAILED_ON_RESTART`);
  }
}
