import type { Context } from "grammy";
import { TERMINAL_STATUSES } from "@penetragent/shared";
import type { JobPublic } from "@penetragent/shared";
import type { ScannerClient } from "../../scanner-client/client.js";
import { handleCommandError } from "../utils/error-handler.js";
import { formatSummary } from "../utils/format-summary.js";

function formatJob(job: JobPublic): string {
  const lines = [
    `Job: ${job.jobId}`,
    `Target: ${job.targetId}`,
    `Scan Type: ${job.scanType}`,
    `Status: ${job.status}`,
    `Created: ${job.createdAt}`,
  ];

  if (job.startedAt) lines.push(`Started: ${job.startedAt}`);
  if (job.finishedAt) lines.push(`Finished: ${job.finishedAt}`);

  if (job.errorCode) {
    lines.push(`Error: ${job.errorCode}`);
    if (job.errorMessage) lines.push(`Message: ${job.errorMessage}`);
  }

  if (
    job.summaryJson &&
    TERMINAL_STATUSES.has(job.status)
  ) {
    const summary = job.summaryJson as Record<string, unknown>;
    lines.push("");
    lines.push("Summary:");
    lines.push(...formatSummary(summary));

    lines.push("");
    lines.push("Note:");
    lines.push("  • good = headers properly configured");
    lines.push("  • weak = headers present but not optimal");
    lines.push("  • missing = security headers not found");
    lines.push("  • infoLeakage = headers revealing server details");
  }

  return lines.join("\n");
}

export async function handleStatus(
  ctx: Context,
  args: string[],
  client: ScannerClient,
): Promise<void> {
  if (args.length < 1) {
    await ctx.reply("Usage: status <jobId>");
    return;
  }

  const jobId = args[0];

  try {
    await ctx.api.sendChatAction(ctx.chat!.id, "typing");
    const job = await client.getJob(jobId);
    await ctx.reply(formatJob(job));
  } catch (err) {
    await handleCommandError(ctx, err, `Could not find job: ${jobId}`);
  }
}
