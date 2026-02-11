import type Database from "better-sqlite3";
import type { ScannerConfig } from "@pentegent/shared";
import { ErrorCode } from "@pentegent/shared";
import {
  transitionToSucceeded,
  transitionToFailed,
  updateResolvedIps,
} from "../services/job-service.js";
import type { JobRow } from "../services/job-service.js";
import type { Target } from "../services/target-service.js";
import {
  verifyPublicOnly,
  DnsError,
} from "../security/verify-public-only.js";
import { runHeadersScan } from "../profiles/headers.js";

export async function executeProfile(
  db: Database.Database,
  config: ScannerConfig,
  job: JobRow,
  target: Target,
): Promise<void> {
  const url = new URL(target.base_url);

  let resolvedIps: string[];
  try {
    resolvedIps = await verifyPublicOnly(url.hostname);
    updateResolvedIps(db, job.id, JSON.stringify(resolvedIps));
  } catch (err) {
    if (err instanceof DnsError) {
      updateResolvedIps(db, job.id, JSON.stringify([]));
      transitionToFailed(db, job.id, err.code, err.message);
      return;
    }
    throw err;
  }

  try {
    switch (job.profile_id) {
      case "headers": {
        const { summary } = await runHeadersScan(
          target.base_url,
          config.reportsDir,
          job.id,
        );
        transitionToSucceeded(db, job.id, JSON.stringify(summary));
        break;
      }
      default:
        transitionToFailed(
          db,
          job.id,
          ErrorCode.SCAN_EXECUTION_FAILED,
          `Unknown profile: ${job.profile_id}`,
        );
    }
  } catch (err) {
    transitionToFailed(
      db,
      job.id,
      ErrorCode.SCAN_EXECUTION_FAILED,
      err instanceof Error ? err.message : String(err),
    );
  }
}
