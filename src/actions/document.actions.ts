"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "node:fs/promises";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return { userId: session.user.id, role: (session.user as any).role as string };
}

export async function getMyDocuments() {
  const { userId } = await requireAuth();

  return prisma.document.findMany({
    where: { teacherId: userId },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      status: true,
      createdAt: true,
      discipline: { select: { id: true, name: true } },
      _count: { select: { lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDocument(documentId: string) {
  const { userId } = await requireAuth();

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { teacherId: true, storagePath: true, _count: { select: { lessons: true } } },
  });

  if (!doc) throw new Error("Documento non trovato");
  if (doc.teacherId !== userId) throw new Error("Non puoi eliminare documenti di altri utenti");
  if (doc._count.lessons > 0) {
    throw new Error("Non puoi eliminare un documento collegato a delle lezioni. Rimuovi prima le associazioni.");
  }

  // Delete file from disk
  try {
    await unlink(doc.storagePath);
  } catch {
    // File might already be gone — continue with DB deletion
  }

  await prisma.document.delete({ where: { id: documentId } });
}
