import Anthropic from "@anthropic-ai/sdk";
import { decrypt } from "./crypto";
import { prisma } from "./prisma";

export async function createClaudeClient(userId: string): Promise<Anthropic> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { anthropicApiKey: true, apiKeyConfigured: true },
  });

  if (!user || !user.apiKeyConfigured || !user.anthropicApiKey) {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }

  const apiKey = decrypt(user.anthropicApiKey);
  return new Anthropic({ apiKey });
}
