"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, maskApiKey } from "@/lib/crypto";
import { hashSync, compareSync } from "bcryptjs";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const apiKeySchema = z.object({
  apiKey: z.string().min(1, "La API key è obbligatoria"),
});

const profileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.email(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function getApiKeyStatus() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiKeyConfigured: true, anthropicApiKey: true },
  });

  if (!user) throw new Error("Utente non trovato");

  let maskedKey: string | null = null;
  if (user.apiKeyConfigured && user.anthropicApiKey) {
    try {
      const decrypted = decrypt(user.anthropicApiKey);
      maskedKey = maskApiKey(decrypted);
    } catch {
      maskedKey = null;
    }
  }

  return {
    configured: user.apiKeyConfigured,
    maskedKey,
  };
}

export async function saveApiKey(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato" };

  const parsed = apiKeySchema.safeParse({
    apiKey: formData.get("apiKey"),
  });

  if (!parsed.success) {
    return { error: "Inserisci una API key valida." };
  }

  const apiKey = parsed.data.apiKey.trim();

  // Validate format
  if (!apiKey.startsWith("sk-ant-")) {
    return { error: "La API key deve iniziare con 'sk-ant-'." };
  }

  // Test the key with a minimal API call
  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1,
      messages: [{ role: "user", content: "test" }],
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return { error: "API key non valida. Verifica di averla copiata correttamente." };
    }
    // Other errors (rate limit, etc.) mean the key is valid
    if (error?.status !== 429 && error?.status !== 400 && error?.status !== 529) {
      return { error: "Errore nella verifica della API key. Riprova più tardi." };
    }
  }

  // Encrypt and save
  const encrypted = encrypt(apiKey);
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      anthropicApiKey: encrypted,
      apiKeyConfigured: true,
    },
  });

  return { success: true };
}

export async function removeApiKey() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      anthropicApiKey: null,
      apiKeyConfigured: false,
    },
  });
}

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato" };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Compila tutti i campi correttamente." };
  }

  // Check if email is taken by another user
  if (parsed.data.email !== session.user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing && existing.id !== session.user.id) {
      return { error: "Questa email è già in uso." };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
    },
  });

  return { success: true };
}

export async function changePassword(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato" };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { error: "La nuova password deve avere almeno 6 caratteri." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user) return { error: "Utente non trovato" };

  const isValid = compareSync(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "La password attuale non è corretta." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash: hashSync(parsed.data.newPassword, 12),
    },
  });

  return { success: true };
}

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      discipline: { select: { name: true } },
    },
  });

  return user;
}
