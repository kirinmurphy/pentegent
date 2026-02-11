import type { Context } from "grammy";
import {
  ScannerClient,
  RateLimitedError,
  ScannerUnavailableError,
} from "../../scanner-client/client.js";
import type { JobPoller } from "../../poller/job-poller.js";

export async function handleScan(
  ctx: Context,
  args: string[],
  client: ScannerClient,
  poller: JobPoller,
): Promise<void> {
  if (args.length < 2) {
    await ctx.reply("Usage: scan <targetId> <profileId>");
    return;
  }

  const [targetId, profileId] = args;
  const userId = ctx.from!.id.toString();
  const chatId = ctx.chat!.id;

  try {
    await ctx.api.sendChatAction(chatId, "typing");
    const job = await client.createScan(targetId, profileId, userId);
    await ctx.reply(
      `Scan started!\nJob ID: ${job.jobId}\nStatus: ${job.status}\n\nI'll notify you when it completes.`,
    );
    poller.startPolling(job.jobId, chatId);
  } catch (err) {
    if (err instanceof RateLimitedError) {
      await ctx.reply(
        `A scan is already running (job: ${err.runningJobId}). Please wait for it to finish.`,
      );
      return;
    }
    if (err instanceof ScannerUnavailableError) {
      await ctx.reply("Scanner service is unavailable. Please try again later.");
      return;
    }
    await ctx.reply(
      `Scan failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
