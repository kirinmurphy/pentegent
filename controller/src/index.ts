import { loadConfig } from "./config.js";
import { createBot } from "./bot/bot.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const bot = createBot(config);

  console.log("Starting controller bot...");
  await bot.start({
    onStart: () => console.log("Bot is running"),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
