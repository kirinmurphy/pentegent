import type { Context } from "grammy";

export async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(
    [
      "Available commands:",
      "",
      "help — Show this message",
      "targets — List available scan targets",
      "profiles — List available scan profiles",
      "scan <targetId> <profileId> — Start a new scan",
      "status <jobId> — Check scan status",
      "history — Show recent scan history",
    ].join("\n"),
  );
}
