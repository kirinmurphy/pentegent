import type { Context } from "grammy";
import { TERMINAL_STATUSES, SCAN_TYPES } from "@penetragent/shared";
import type { JobPublic, ScanTypeId } from "@penetragent/shared";
import type { ScannerClient } from "../../scanner-client/client.js";
import { handleCommandError } from "../utils/error-handler.js";
import { formatSummary } from "../utils/format-summary.js";
import { formatHumanDate } from "../utils/format-date.js";
import { formatDuration } from "../utils/format-duration.js";
import { CHAT_ACTION } from "../constants.js";

export async function handleStatus(params: {
  ctx: Context;
  args: string[];
  client: ScannerClient;
}): Promise<void> {
  const { ctx, args, client } = params;
  if (args.length < 1) {
    await ctx.reply("Usage: status <jobId>");
    return;
  }

  const jobId = args[0];

  try {
    await ctx.api.sendChatAction(ctx.chat!.id, CHAT_ACTION.TYPING);
    const job = await client.getJob(jobId);
    await ctx.reply(formatJob(job));
  } catch (err) {
    await handleCommandError(ctx, err, `Could not find job: ${jobId}`);
  }
}

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
