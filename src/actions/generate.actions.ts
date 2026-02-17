"use server";

import { auth } from "@/auth";
import { generateContent } from "@/services/generation";
import type { ContentType } from "@/generated/prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return session.user.id;
}

export async function generateDirect(data: {
  title: string;
  description?: string;
  contentType: ContentType;
  disciplineId: string;
  documentId?: string;
  className?: string;
}) {
  const userId = await requireAuth();

  if (!data.title.trim()) throw new Error("L'argomento è obbligatorio");
  if (!data.disciplineId) throw new Error("La disciplina è obbligatoria");

  const result = await generateContent({
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    contentType: data.contentType,
    disciplineId: data.disciplineId,
    userId,
    documentId: data.documentId || undefined,
    className: data.className?.trim() || undefined,
  });

  return result;
}
