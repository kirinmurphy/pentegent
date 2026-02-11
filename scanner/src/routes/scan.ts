import type { FastifyInstance } from "fastify";
import { ScanRequestSchema, ErrorCode } from "@pentegent/shared";
import { getTarget, upsertTarget } from "../services/target-service.js";
import { getProfile } from "../services/profile-service.js";
import {
  createJob,
  findRunningJob,
  getJob,
  toJobPublic,
} from "../services/job-service.js";

export async function scanRoutes(app: FastifyInstance): Promise<void> {
  app.post("/scan", async (request, reply) => {
    const parsed = ScanRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: ErrorCode.VALIDATION_ERROR,
        details: parsed.error.flatten(),
      });
    }

    const { profileId, requestedBy } = parsed.data;

    let targetId: string;
    if (parsed.data.url) {
      const target = upsertTarget(app.db, parsed.data.url);
      targetId = target.id;
    } else {
      targetId = parsed.data.targetId!;
      const target = getTarget(app.db, targetId);
      if (!target) {
        return reply.status(404).send({ error: ErrorCode.TARGET_NOT_FOUND });
      }
    }

    const profile = getProfile(app.db, profileId);
    if (!profile) {
      return reply.status(404).send({ error: ErrorCode.PROFILE_NOT_FOUND });
    }

    const running = findRunningJob(app.db);
    if (running) {
      return reply.status(429).send({
        error: ErrorCode.RATE_LIMITED,
        runningJobId: running.id,
      });
    }

    const jobId = createJob(app.db, targetId, profileId, requestedBy);
    const job = getJob(app.db, jobId)!;

    return reply.status(201).send(toJobPublic(job));
  });
}
