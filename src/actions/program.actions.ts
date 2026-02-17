"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/services/extraction";
import { parseProgram } from "@/services/parsing";
import { generateContent } from "@/services/generation";
import type { ContentType } from "@/generated/prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return session.user.id;
}

// --- Existing actions ---

export async function requestProgramPublication(programId: string) {
  const userId = await requireAuth();

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error("Programma non trovato");
  if (program.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.program.update({
    where: { id: programId },
    data: {
      visibility: "PUBLIC",
      approvalStatus: "PENDING",
      rejectionReason: null,
    },
  });
}

export async function setProgramPrivate(programId: string) {
  const userId = await requireAuth();

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error("Programma non trovato");
  if (program.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.program.update({
    where: { id: programId },
    data: {
      visibility: "PRIVATE",
      approvalStatus: "NONE",
      rejectionReason: null,
      approvedById: null,
      approvedAt: null,
    },
  });
}

// --- New actions ---

export async function createProgram(data: {
  title: string;
  schoolYear: string;
  className: string;
  disciplineId: string;
  documentId?: string;
  rawContent?: string;
}) {
  const userId = await requireAuth();

  const { title, schoolYear, className, disciplineId, documentId, rawContent } = data;

  if (!title.trim()) throw new Error("Il titolo è obbligatorio");
  if (!schoolYear.trim()) throw new Error("L'anno scolastico è obbligatorio");
  if (!className.trim()) throw new Error("La classe è obbligatoria");

  const discipline = await prisma.discipline.findUnique({ where: { id: disciplineId } });
  if (!discipline) throw new Error("Disciplina non trovata");

  let finalRawContent = rawContent?.trim() || null;

  // If a document is provided, extract text from it
  if (documentId) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { storagePath: true, mimeType: true, extractedText: true, teacherId: true },
    });
    if (!doc) throw new Error("Documento non trovato");
    if (doc.teacherId !== userId) throw new Error("Accesso negato al documento");

    if (doc.extractedText) {
      finalRawContent = doc.extractedText;
    } else {
      const text = await extractText(doc.storagePath, doc.mimeType);
      // Save extracted text on the document for future use
      await prisma.document.update({
        where: { id: documentId },
        data: { extractedText: text, status: "EXTRACTED" },
      });
      finalRawContent = text;
    }
  }

  const program = await prisma.program.create({
    data: {
      title: title.trim(),
      schoolYear: schoolYear.trim(),
      className: className.trim(),
      rawContent: finalRawContent,
      status: "DRAFT",
      teacherId: userId,
      disciplineId,
    },
  });

  return { id: program.id };
}

export async function parseProgramAction(programId: string) {
  const userId = await requireAuth();

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error("Programma non trovato");
  if (program.teacherId !== userId) throw new Error("Accesso negato");
  if (!program.rawContent) throw new Error("Nessun contenuto da analizzare");

  await parseProgram(programId, userId);
}

export async function generateTopicLesson(topicId: string) {
  const userId = await requireAuth();

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      module: {
        include: {
          program: { select: { teacherId: true, disciplineId: true, className: true } },
        },
      },
    },
  });

  if (!topic) throw new Error("Argomento non trovato");
  if (topic.module.program.teacherId !== userId) throw new Error("Accesso negato");
  if (topic.status !== "PENDING" && topic.status !== "FAILED") {
    throw new Error("L'argomento non è in stato generabile");
  }

  const result = await generateContent({
    topicId: topic.id,
    title: topic.title,
    description: topic.description || undefined,
    contentType: topic.contentType,
    disciplineId: topic.module.program.disciplineId,
    userId,
    className: topic.module.program.className,
  });

  return result;
}

export async function getProgram(programId: string) {
  const userId = await requireAuth();

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      discipline: { select: { id: true, name: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              lesson: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  if (!program) throw new Error("Programma non trovato");
  if (program.teacherId !== userId) throw new Error("Accesso negato");

  return program;
}

export async function addModule(programId: string, name: string) {
  const userId = await requireAuth();

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { modules: { select: { order: true }, orderBy: { order: "desc" } } },
  });
  if (!program) throw new Error("Programma non trovato");
  if (program.teacherId !== userId) throw new Error("Accesso negato");

  const nextOrder = program.modules.length > 0 ? program.modules[0].order + 1 : 0;

  await prisma.module.create({
    data: {
      name: name.trim(),
      order: nextOrder,
      programId,
    },
  });
}

export async function updateModule(moduleId: string, data: { name: string }) {
  const userId = await requireAuth();

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { program: { select: { teacherId: true } } },
  });
  if (!mod) throw new Error("Modulo non trovato");
  if (mod.program.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.module.update({
    where: { id: moduleId },
    data: { name: data.name.trim() },
  });
}

export async function deleteModule(moduleId: string) {
  const userId = await requireAuth();

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { program: { select: { teacherId: true } } },
  });
  if (!mod) throw new Error("Modulo non trovato");
  if (mod.program.teacherId !== userId) throw new Error("Accesso negato");

  // Cascade will delete topics too
  await prisma.module.delete({ where: { id: moduleId } });
}

export async function addTopic(moduleId: string, title: string) {
  const userId = await requireAuth();

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      program: { select: { teacherId: true } },
      topics: { select: { order: true }, orderBy: { order: "desc" } },
    },
  });
  if (!mod) throw new Error("Modulo non trovato");
  if (mod.program.teacherId !== userId) throw new Error("Accesso negato");

  const nextOrder = mod.topics.length > 0 ? mod.topics[0].order + 1 : 0;

  await prisma.topic.create({
    data: {
      title: title.trim(),
      order: nextOrder,
      status: "PENDING",
      contentType: "LEZIONE",
      moduleId,
    },
  });
}

export async function updateTopic(
  topicId: string,
  data: { title?: string; contentType?: ContentType; description?: string }
) {
  const userId = await requireAuth();

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { module: { include: { program: { select: { teacherId: true } } } } },
  });
  if (!topic) throw new Error("Argomento non trovato");
  if (topic.module.program.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.topic.update({
    where: { id: topicId },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.contentType !== undefined && { contentType: data.contentType }),
      ...(data.description !== undefined && { description: data.description.trim() || null }),
    },
  });
}

export async function deleteTopic(topicId: string) {
  const userId = await requireAuth();

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { module: { include: { program: { select: { teacherId: true } } } } },
  });
  if (!topic) throw new Error("Argomento non trovato");
  if (topic.module.program.teacherId !== userId) throw new Error("Accesso negato");
  if (topic.status !== "PENDING" && topic.status !== "FAILED") {
    throw new Error("Puoi eliminare solo argomenti in stato 'In attesa' o 'Errore'");
  }

  await prisma.topic.delete({ where: { id: topicId } });
}

export async function deleteTopicLesson(topicId: string) {
  const userId = await requireAuth();

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      module: {
        include: { program: { select: { teacherId: true } } },
      },
    },
  });

  if (!topic) throw new Error("Argomento non trovato");
  if (topic.module.program.teacherId !== userId) throw new Error("Accesso negato");
  if (topic.status !== "GENERATED" || !topic.lessonId) {
    throw new Error("Nessuna lezione da eliminare per questo argomento");
  }

  await prisma.lesson.delete({ where: { id: topic.lessonId } });

  await prisma.topic.update({
    where: { id: topicId },
    data: { status: "PENDING", lessonId: null },
  });
}
