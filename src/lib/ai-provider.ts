import { prisma } from "./prisma";
import { isGeminiConfigured } from "./gemini";

export type AiProvider = "claude" | "gemini";

export async function resolveAiProvider(userId: string): Promise<AiProvider> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiKeyConfigured: true },
  });

  if (user?.apiKeyConfigured) {
    return "claude";
  }

  const geminiReady = await isGeminiConfigured();
  if (geminiReady) {
    return "gemini";
  }

  throw new Error("AI_NOT_AVAILABLE");
}
