function normalizeTelegramValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
}

export function getTelegramConfig() {
  let token = normalizeTelegramValue(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = normalizeTelegramValue(process.env.TELEGRAM_CHAT_ID);
  if (token && /^bot\d+:/i.test(token)) {
    token = token.slice(3);
  }
  return token && chatId ? { token, chatId } : null;
}
