import { prisma } from "./prisma";

const DAILY_GEMINI_LIMIT = 10;

export async function checkGeminiRateLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const used = await prisma.aiUsageLog.count({
    where: {
      userId,
      provider: "gemini",
      createdAt: { gte: today },
    },
  });

  return {
    allowed: used < DAILY_GEMINI_LIMIT,
    used,
    limit: DAILY_GEMINI_LIMIT,
  };
}

export async function logAiUsage(
  userId: string,
  provider: "claude" | "gemini",
  operation: string
): Promise<void> {
  await prisma.aiUsageLog.create({
    data: { userId, provider, operation },
  });
}
