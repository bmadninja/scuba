/**
 * Telegram notification helper for Scuba Season ops alerts.
 *
 * Bot token is read from TELEGRAM_BOT_TOKEN env var.
 * Falls back to ~/.openclaw/openclaw.json at .channels.telegram.bot_token
 * if the env var is absent (local dev convenience).
 *
 * Chat ID is always 1289833065 (Josie / Scuba Season ops).
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CHAT_ID = "1289833065";

function getBotToken(): string | null {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;

  try {
    const configPath = join(homedir(), ".openclaw", "openclaw.json");
    const raw = readFileSync(configPath, "utf-8");
    const cfg = JSON.parse(raw) as {
      channels?: { telegram?: { bot_token?: string } };
    };
    return cfg.channels?.telegram?.bot_token ?? null;
  } catch {
    return null;
  }
}

export async function sendTelegram(message: string): Promise<void> {
  const token = getBotToken();
  if (!token) {
    console.warn("[telegram] no bot token — message not sent:", message);
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[telegram] sendMessage failed (${res.status}): ${body}`);
  }
}
