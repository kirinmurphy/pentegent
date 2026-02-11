import type { Context } from "grammy";
import type { ScannerClient } from "../../scanner-client/client.js";

export async function handleTargets(
  ctx: Context,
  client: ScannerClient,
): Promise<void> {
  try {
    // Use listJobs to verify scanner is up, then get targets from a health-like endpoint
    // Since we don't have a /targets endpoint, we'll use the scanner's data
    // For now, list known targets from the scanner
    const health = await client.health();
    if (!health.ok) {
      await ctx.reply("Scanner is not healthy.");
      return;
    }
    // TODO: When scanner exposes /targets endpoint, use it
    await ctx.reply(
      [
        "Available targets:",
        "",
        "• staging — Staging environment",
        "• prod — Production environment",
      ].join("\n"),
    );
  } catch {
    await ctx.reply("Could not reach scanner service.");
  }
}
