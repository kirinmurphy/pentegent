import { TERMINAL_STATUSES, JobStatus, SCAN_TYPES } from "@penetragent/shared";
import type { JobPublic, ScanTypeId } from "@penetragent/shared";
import type { Bot, Context } from "grammy";
import { InputFile } from "grammy";
import type { ScannerClient } from "../scanner-client/client.js";
import { formatSummary } from "../bot/utils/format-summary.js";
import { formatHumanDate } from "../bot/utils/format-date.js";
import { formatDuration } from "../bot/utils/format-duration.js";

const MAX_JOBS_TO_RECOVER = 100;
const TELEGRAM_CAPTION_LIMIT = 1024;

function truncateCaption(text: string): string {
  if (text.length <= TELEGRAM_CAPTION_LIMIT) return text;
  return text.slice(0, TELEGRAM_CAPTION_LIMIT - 3) + "...";
}

function buildReportFilename(targetId: string, finishedAt: string): string {
  const date = new Date(finishedAt).toISOString().split("T")[0];
  return `${targetId}-${date}.html`;
}

const IN_PROGRESS_STATUSES = `${JobStatus.RUNNING},${JobStatus.QUEUED}`;

function formatJob(job: JobPublic): string {
  const lines = [
    `Job: ${job.jobId}`,
    `Target: ${job.targetId}`,
  ];

  if (job.scanType !== "all") {
    const scanTypeName = SCAN_TYPES[job.scanType as ScanTypeId]?.name || job.scanType;
    lines.push(`Scan Type: ${scanTypeName}`);
  }

  lines.push(`Status: ${job.status}`);

  if (job.finishedAt && job.createdAt) {
    const duration = formatDuration(job.createdAt, job.finishedAt);
    const formattedDate = formatHumanDate(job.finishedAt);
    lines.push(`Finished: ${formattedDate} (completed in ${duration})`);
  } else if (job.createdAt) {
    lines.push(`Created: ${formatHumanDate(job.createdAt)}`);
  }

  if (job.errorCode) {
    lines.push(`Error: ${job.errorCode}`);
    if (job.errorMessage) lines.push(`Message: ${job.errorMessage}`);
  }

  if (job.summaryJson && TERMINAL_STATUSES.has(job.status)) {
    const summary = job.summaryJson as Record<string, unknown>;
    lines.push("");
    lines.push("Summary:");
    lines.push(...formatSummary(summary));
  }

  return lines.join("\n");
}

export class JobPoller {
  private readonly polls = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private readonly client: ScannerClient,
    private readonly bot: Bot<Context>,
    private readonly pollIntervalMs: number,
    private readonly pollTimeoutMs: number,
    private readonly scannerBaseUrl: string,
  ) {}

  async recoverInProgressJobs(): Promise<void> {
    try {
      const response = await this.client.listJobs({
        limit: MAX_JOBS_TO_RECOVER,
        status: IN_PROGRESS_STATUSES,
      });
      const inProgressJobs = response.jobs;

      if (inProgressJobs.length > 0) {
        console.log(
          `Recovering ${inProgressJobs.length} in-progress job(s)...`,
        );
        for (const job of inProgressJobs) {
          const chatId = parseInt(job.requestedBy, 10);
          if (!isNaN(chatId)) {
            console.log(`Resuming polling for job ${job.jobId}`);
            this.startPolling(job.jobId, chatId);
          } else {
            console.warn(
              `Cannot resume job ${job.jobId}: invalid requestedBy "${job.requestedBy}"`,
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to recover in-progress jobs:", err);
    }
  }

  startPolling(jobId: string, chatId: number): void {
    if (this.polls.has(jobId)) {
      console.log(
        `Polling already active for job ${jobId}, skipping duplicate`,
      );
      return;
    }

    const startTime = Date.now();

    const timer = setInterval(async () => {
      try {
        if (Date.now() - startTime > this.pollTimeoutMs) {
          this.stopPolling(jobId);
          await this.bot.api.sendMessage(
            chatId,
            `Job ${jobId} polling timed out. Use "status ${jobId}" to check manually.`,
          );
          return;
        }

        const job = await this.client.getJob(jobId);

        if (TERMINAL_STATUSES.has(job.status)) {
          this.stopPolling(jobId);

          if (job.status === JobStatus.SUCCEEDED) {
            await this.sendHtmlReport(job, chatId, formatJob(job));
          } else {
            await this.bot.api.sendMessage(chatId, formatJob(job));
          }
        }
      } catch (err) {
        console.error(`Polling error for job ${jobId}:`, err);
      }
    }, this.pollIntervalMs);

    this.polls.set(jobId, timer);
  }

  private stopPolling(jobId: string): void {
    const timer = this.polls.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.polls.delete(jobId);
    }
  }

  private async sendHtmlReport(job: JobPublic, chatId: number, statusMessage: string): Promise<void> {
    try {
      const reportUrl = `${this.scannerBaseUrl}/reports/${job.jobId}/html`;
      const response = await fetch(reportUrl);

      if (!response.ok) {
        console.error(`Failed to fetch HTML report for job ${job.jobId}: ${response.status}`);
        await this.bot.api.sendMessage(chatId, statusMessage);
        return;
      }

      const htmlContent = await response.text();
      const buffer = Buffer.from(htmlContent, "utf-8");
      const caption = truncateCaption(statusMessage);
      const filename = buildReportFilename(job.targetId, job.finishedAt ?? new Date().toISOString());

      await this.bot.api.sendDocument(
        chatId,
        new InputFile(buffer, filename),
        { caption },
      );
    } catch (err) {
      console.error(`Error sending HTML report for job ${job.jobId}:`, err);
      await this.bot.api.sendMessage(chatId, statusMessage);
    }
  }
}
