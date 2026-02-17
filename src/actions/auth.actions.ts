"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Credenziali non valide." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/programs",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o password non corretti, oppure account non attivo." };
    }
    throw error;
  }
}

export async function registerAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });

  if (!parsed.success) {
    return { error: "Compila tutti i campi correttamente. La password deve avere almeno 6 caratteri." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { error: "Esiste già un account con questa email." };
  }

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: hashSync(parsed.data.password, 12),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: "TEACHER",
      status: "PENDING",
    },
  });

  return { success: true };
}
