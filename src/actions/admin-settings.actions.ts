"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, maskApiKey } from "@/lib/crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  if ((session.user as any).role !== "ADMIN") throw new Error("Accesso negato");
  return session.user.id;
}

export async function getGeminiKeyStatus() {
  await requireAdmin();

  const config = await prisma.systemConfig.findUnique({
    where: { key: "gemini_api_key" },
  });

  if (!config) {
    return { configured: false, maskedKey: null };
  }

  try {
    const decrypted = decrypt(config.value);
    return { configured: true, maskedKey: maskApiKey(decrypted) };
  } catch {
    return { configured: true, maskedKey: null };
  }
}

export async function saveGeminiKey(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  await requireAdmin();

  const apiKey = (formData.get("apiKey") as string)?.trim();
  if (!apiKey) {
    return { error: "La API key è obbligatoria." };
  }

  // Test the key with a minimal Gemini call
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    await model.generateContent("test");
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("API_KEY_INVALID") || msg.includes("401") || msg.includes("403")) {
      return { error: "API key non valida. Verifica di averla copiata correttamente." };
    }
    // Rate limit or other transient errors mean the key is valid
    if (!msg.includes("429") && !msg.includes("RESOURCE_EXHAUSTED")) {
      return { error: `Errore nella verifica: ${msg}` };
    }
  }

  // Encrypt and upsert
  const encrypted = encrypt(apiKey);
  await prisma.systemConfig.upsert({
    where: { key: "gemini_api_key" },
    update: { value: encrypted },
    create: { key: "gemini_api_key", value: encrypted },
  });

  return { success: true };
}

export async function removeGeminiKey() {
  await requireAdmin();

  await prisma.systemConfig.deleteMany({
    where: { key: "gemini_api_key" },
  });
}

export async function getGeminiUsageStats() {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCount, totalCount] = await Promise.all([
    prisma.aiUsageLog.count({
      where: {
        provider: "gemini",
        createdAt: { gte: today },
      },
    }),
    prisma.aiUsageLog.count({
      where: { provider: "gemini" },
    }),
  ]);

  return { todayCount, totalCount };
}
