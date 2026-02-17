import { GoogleGenerativeAI } from "@google/generative-ai";
import { decrypt } from "./crypto";
import { prisma } from "./prisma";

export async function createGeminiClient(): Promise<GoogleGenerativeAI> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "gemini_api_key" },
  });

  if (!config) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }

  const apiKey = decrypt(config.value);
  return new GoogleGenerativeAI(apiKey);
}

export async function isGeminiConfigured(): Promise<boolean> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "gemini_api_key" },
  });
  return config !== null;
}
