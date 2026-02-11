import { TERMINAL_STATUSES } from "@pentegent/shared";
import type { Bot, Context } from "grammy";
import type { ScannerClient } from "../scanner-client/client.js";

export class JobPoller {
  private readonly polls = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private readonly client: ScannerClient,
    private readonly bot: Bot<Context>,
    private readonly pollIntervalMs: number,
    private readonly pollTimeoutMs: number,
  ) {}

  startPolling(jobId: string, chatId: number): void {
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

          const lines = [`Job ${jobId} completed!`, `Status: ${job.status}`];

          if (job.errorCode) {
            lines.push(`Error: ${job.errorCode}`);
            if (job.errorMessage) lines.push(`Message: ${job.errorMessage}`);
          }

          if (job.summaryJson) {
            const summary = job.summaryJson as Record<string, unknown>;
            lines.push("");
            lines.push("Summary:");
            for (const [key, value] of Object.entries(summary)) {
              if (Array.isArray(value)) {
                lines.push(`  ${key}: ${value.join(", ") || "none"}`);
              } else {
                lines.push(`  ${key}: ${value}`);
              }
            }
          }

          await this.bot.api.sendMessage(chatId, lines.join("\n"));
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
}
