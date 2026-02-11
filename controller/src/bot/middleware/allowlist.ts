import type { Context, NextFunction } from "grammy";

export function allowlistMiddleware(allowedUserId: string) {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const userId = ctx.from?.id?.toString();
    if (userId !== allowedUserId) {
      // Silently drop non-allowed users
      return;
    }
    await next();
  };
}
