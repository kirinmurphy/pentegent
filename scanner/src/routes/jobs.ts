import type { FastifyInstance } from "fastify";
import { JobListQuerySchema, ErrorCode } from "@penetragent/shared";
import {
  getJob,
  listJobs,
  listJobsByTarget,
  toJobPublic,
  deleteJob,
  deleteJobsByTarget,
  deleteAllJobs,
} from "../services/job-service.js";
import fs from "node:fs";
import path from "node:path";

export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { jobId: string } }>(
    "/jobs/:jobId",
    async (request, reply) => {
      const job = getJob(app.db, request.params.jobId);
      if (!job) {
        return reply.status(404).send({ error: ErrorCode.JOB_NOT_FOUND });
      }
      return toJobPublic(job);
    },
  );

  app.get("/jobs", async (request) => {
    const query = JobListQuerySchema.parse(request.query);

    let jobs, total;
    if (query.targetId) {
      ({ jobs, total } = listJobsByTarget(
        app.db,
        query.targetId,
        query.limit,
        query.offset,
      ));
    } else {
      ({ jobs, total } = listJobs(
        app.db,
        query.limit,
        query.offset,
        query.status,
      ));
    }

    return {
      jobs: jobs.map(toJobPublic),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  });

  // DELETE /jobs/:jobId - Delete single job
  app.delete<{ Params: { jobId: string } }>(
    "/jobs/:jobId",
    async (request, reply) => {
      const { jobId } = request.params;
      const job = getJob(app.db, jobId);

      if (!job) {
        return reply.status(404).send({ error: ErrorCode.JOB_NOT_FOUND });
      }

      // Delete from database
      const deleted = deleteJob(app.db, jobId);

      // Delete report files if they exist
      const reportDir = path.join(app.config.reportsDir, jobId);
      if (fs.existsSync(reportDir)) {
        fs.rmSync(reportDir, { recursive: true, force: true });
      }

      return { deleted };
    },
  );

  // DELETE /jobs/all - Delete all jobs
  app.delete("/jobs/all", async (_request, _reply) => {
    const { jobs } = listJobs(app.db, 10000, 0);

    // Delete from database
    const deleted = deleteAllJobs(app.db);

    // Delete all report directories
    for (const job of jobs) {
      const reportDir = path.join(app.config.reportsDir, job.id);
      if (fs.existsSync(reportDir)) {
        fs.rmSync(reportDir, { recursive: true, force: true });
      }
    }

    return { deleted };
  });

  // DELETE /jobs?targetId=<id> - Delete all jobs for target
  // This must come after /jobs/all to avoid route conflict
  app.delete("/jobs", async (request, reply) => {
    const query = request.query as { targetId?: string };

    if (!query.targetId) {
      return reply.status(400).send({ error: "targetId query parameter required" });
    }

    // Get all jobs for this target first (to delete report files)
    const { jobs } = listJobsByTarget(app.db, query.targetId, 10000, 0);

    // Delete from database
    const deleted = deleteJobsByTarget(app.db, query.targetId);

    // Delete report files
    for (const job of jobs) {
      const reportDir = path.join(app.config.reportsDir, job.id);
      if (fs.existsSync(reportDir)) {
        fs.rmSync(reportDir, { recursive: true, force: true });
      }
    }

    return { deleted };
  });
}
