import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/reports/:jobId/html", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const reportsDir = app.config.reportsDir;
    const jobDir = path.join(reportsDir, jobId);

    try {
      if (!fs.existsSync(jobDir)) {
        return reply.code(404).send({
          error: "REPORT_NOT_FOUND",
          message: `HTML report not found for job ${jobId}`,
        });
      }

      const htmlFile = fs.readdirSync(jobDir).find((f) => f.endsWith(".html"));
      if (!htmlFile) {
        return reply.code(404).send({
          error: "REPORT_NOT_FOUND",
          message: `HTML report not found for job ${jobId}`,
        });
      }

      const htmlContent = fs.readFileSync(path.join(jobDir, htmlFile), "utf-8");
      return reply.type("text/html").send(htmlContent);
    } catch (err) {
      return reply.code(500).send({
        error: "REPORT_READ_ERROR",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.get("/reports/:jobId/json", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const reportsDir = app.config.reportsDir;
    const jsonPath = path.join(reportsDir, jobId, "report.json");

    try {
      if (!fs.existsSync(jsonPath)) {
        return reply.code(404).send({
          error: "REPORT_NOT_FOUND",
          message: `JSON report not found for job ${jobId}`,
        });
      }

      const jsonContent = fs.readFileSync(jsonPath, "utf-8");
      return reply.type("application/json").send(jsonContent);
    } catch (err) {
      return reply.code(500).send({
        error: "REPORT_READ_ERROR",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
