import type { Context } from "grammy";

export async function handleProfiles(ctx: Context): Promise<void> {
  await ctx.reply(
    [
      "Available scan profiles:",
      "",
      "• headers — HTTP Security Headers check",
    ].join("\n"),
  );
}
