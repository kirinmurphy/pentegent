import type { Context } from "grammy";
import type { ScannerClient } from "../../scanner-client/client.js";
import { formatHumanDate } from "../utils/format-date.js";
import { groupJobsByTarget } from "../utils/group-history.js";
import { detectIdentifier } from "../utils/detect-identifier.js";
import { INPUT_ALL, IDENTIFIER_TYPE } from "../constants.js";
import type { JobPublic } from "@penetragent/shared";

export async function handleHistory(
  ctx: Context,
  args: string[],
  client: ScannerClient,
): Promise<void> {
  try {
    await ctx.api.sendChatAction(ctx.chat!.id, "typing");

    if (args.length > 0) {
      const identifier = args[0];

      if (identifier === INPUT_ALL) {
        const { jobs } = await client.listJobs({ limit: 1000 });

        if (jobs.length === 0) {
          await ctx.reply("No scan history found.");
          return;
        }

        const lines = [`All scans (${jobs.length} total):\n`];
        for (const job of jobs) {
          lines.push(formatJobLine(job));
        }

        await ctx.reply(lines.join("\n"));
        return;
      }

      const detected = detectIdentifier(identifier);

      if (detected.type === IDENTIFIER_TYPE.JOB_ID) {
        const job = await client.getJob(detected.value);
        const date = formatHumanDate(job.createdAt);
        const lines = [
          `Job ${job.jobId.slice(0, 8)}…`,
          `Target: ${job.targetId}`,
          `Scan Type: ${job.scanType}`,
          `Status: ${job.status}`,
          `Created: ${date}`,
        ];
        await ctx.reply(lines.join("\n"));
        return;
      } else if (detected.type === IDENTIFIER_TYPE.URL || detected.type === IDENTIFIER_TYPE.TARGET_ID) {
        let targetId = detected.value;
        if (detected.type === IDENTIFIER_TYPE.URL) {
          try {
            const url = new URL(detected.value);
            targetId = url.hostname + url.pathname.replace(/\/$/, "");
          } catch {
            targetId = detected.value;
          }
        }

        const { jobs } = await client.listJobs({ limit: 1000 });
        const filtered = jobs.filter((j) => j.targetId === targetId);

        if (filtered.length === 0) {
          await ctx.reply(`No scans found for ${targetId}`);
          return;
        }

        const lines = [`All scans for ${targetId} (${filtered.length} total):\n`];
        for (const job of filtered) {
          lines.push(formatJobLine(job));
        }

        await ctx.reply(lines.join("\n"));
        return;
      }
    }

    const limit = args.length > 0 && !isNaN(Number(args[0]))
      ? Math.min(1000, parseInt(args[0], 10))
      : 100;
    const { jobs } = await client.listJobs({ limit });

    if (jobs.length === 0) {
      await ctx.reply("No scan history found.");
      return;
    }

    const jobsWithUrl = jobs.map((j) => ({
      jobId: j.jobId,
      targetId: j.targetId,
      targetUrl: `https://${j.targetId}`,
      status: j.status,
      createdAt: j.createdAt,
    }));

    const groups = groupJobsByTarget(jobsWithUrl, 10);
    const lines = [`Recent scans (${groups.length} unique targets):\n`];

    for (const group of groups) {
      const date = formatHumanDate(group.latestDate);

      lines.push(`${date} | ${group.targetId} | ${group.latestStatus}`);
      lines.push(`  Use \`status ${group.latestJobId}\` for full details`);

      if (group.totalScans > 1) {
        lines.push(
          `  Latest of ${group.totalScans} scans - use \`history ${group.targetId}\` to see all\n`,
        );
      } else {
        lines.push("");
      }
    }

    await ctx.reply(lines.join("\n"));
  } catch {
    await ctx.reply("Could not fetch scan history.");
  }
}

function formatJobLine(job: JobPublic): string {
  const date = formatHumanDate(job.createdAt);
  return `${date} | ${job.targetId} | ${job.scanType} | ${job.status}\n  Use \`status ${job.jobId}\` for full details\n`;
}
