export interface JobForGrouping {
  jobId: string;
  targetId: string;
  targetUrl: string;
  status: string;
  createdAt: string;
}

export interface TargetGroup {
  targetId: string;
  targetUrl: string;
  latestJobId: string;
  latestStatus: string;
  latestDate: string;
  totalScans: number;
}

/**
 * Groups jobs by targetId and returns the most recent job for each target
 * @param jobs Array of jobs to group
 * @param limit Optional limit on number of groups to return
 * @returns Array of target groups, sorted by most recent date first
 */
export function groupJobsByTarget(
  jobs: JobForGrouping[],
  limit?: number,
): TargetGroup[] {
  const groups = new Map<string, TargetGroup>();

  for (const job of jobs) {
    const existing = groups.get(job.targetId);

    if (!existing) {
      groups.set(job.targetId, {
        targetId: job.targetId,
        targetUrl: job.targetUrl,
        latestJobId: job.jobId,
        latestStatus: job.status,
        latestDate: job.createdAt,
        totalScans: 1,
      });
    } else {
      existing.totalScans++;
      // Update if this job is newer
      if (new Date(job.createdAt) > new Date(existing.latestDate)) {
        existing.latestJobId = job.jobId;
        existing.latestStatus = job.status;
        existing.latestDate = job.createdAt;
      }
    }
  }

  // Sort by latest job date (newest first)
  let result = Array.from(groups.values()).sort(
    (a, b) =>
      new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime(),
  );

  // Apply limit if provided
  if (limit !== undefined) {
    result = result.slice(0, limit);
  }

  return result;
}
