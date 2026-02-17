"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contentVisibilityFilter } from "@/lib/utils";
import { runGeneration } from "@/services/generation";
import type { LessonContent } from "@/types/lesson";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return { userId: session.user.id, role: (session.user as any).role as string };
}

export async function requestLessonPublication(lessonId: string) {
  const { userId } = await requireAuth();

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error("Lezione non trovata");
  if (lesson.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      visibility: "PUBLIC",
      approvalStatus: "PENDING",
      rejectionReason: null,
    },
  });
}

export async function setLessonPrivate(lessonId: string) {
  const { userId } = await requireAuth();

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error("Lezione non trovata");
  if (lesson.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      visibility: "PRIVATE",
      approvalStatus: "NONE",
      rejectionReason: null,
      approvedById: null,
      approvedAt: null,
    },
  });
}

export async function getLesson(lessonId: string) {
  const { userId, role } = await requireAuth();

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
      ...contentVisibilityFilter(userId, role),
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      discipline: { select: { id: true, name: true } },
      topic: {
        select: {
          id: true,
          title: true,
          module: {
            select: {
              name: true,
              program: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  if (!lesson) throw new Error("Lezione non trovata");

  return lesson;
}

export async function updateLessonContent(
  lessonId: string,
  content: LessonContent
) {
  const { userId } = await requireAuth();

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error("Lezione non trovata");
  if (lesson.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { content: content as any },
  });
}

export async function createManualLesson(data: {
  title: string;
  description?: string;
  contentType: string;
  disciplineId: string;
  className?: string;
}) {
  const { userId } = await requireAuth();

  const emptyContent: LessonContent = {
    sections: [],
    objectives: [],
    prerequisites: [],
    estimatedDuration: 0,
    targetGrade: "",
    keywords: [],
  };

  const lesson = await prisma.lesson.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      className: data.className?.trim() || null,
      contentType: data.contentType as any,
      content: emptyContent as any,
      aiModelUsed: null,
      visibility: "PRIVATE",
      approvalStatus: "NONE",
      teacherId: userId,
      disciplineId: data.disciplineId,
    },
  });

  return { lessonId: lesson.id };
}

export async function updateLessonMeta(
  lessonId: string,
  data: { title?: string; description?: string; className?: string }
) {
  const { userId } = await requireAuth();

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error("Lezione non trovata");
  if (lesson.teacherId !== userId) throw new Error("Accesso negato");

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() || null }),
      ...(data.className !== undefined && { className: data.className.trim() || null }),
    },
  });
}

export async function deleteLesson(lessonId: string) {
  const { userId } = await requireAuth();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { topic: { select: { id: true } } },
  });
  if (!lesson) throw new Error("Lezione non trovata");
  if (lesson.teacherId !== userId) throw new Error("Accesso negato");

  // If linked to a topic, reset the topic to PENDING
  if (lesson.topic) {
    await prisma.topic.update({
      where: { id: lesson.topic.id },
      data: { status: "PENDING", lessonId: null },
    });
  }

  await prisma.lesson.delete({ where: { id: lessonId } });
}

export async function retryLessonGeneration(lessonId: string) {
  const { userId } = await requireAuth();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { topic: { select: { id: true, contentType: true, title: true, description: true } } },
  });
  if (!lesson) throw new Error("Lezione non trovata");
  if (lesson.teacherId !== userId) throw new Error("Accesso negato");
  if (lesson.status !== "FAILED") throw new Error("La lezione non è in stato di errore");

  // Reset status to GENERATING
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { status: "GENERATING", failureReason: null },
  });

  if (lesson.topic) {
    await prisma.topic.update({
      where: { id: lesson.topic.id },
      data: { status: "GENERATING" },
    });
  }

  // Fire-and-forget
  runGeneration(lessonId, {
    topicId: lesson.topic?.id,
    title: lesson.title,
    description: lesson.description || undefined,
    contentType: lesson.contentType,
    disciplineId: lesson.disciplineId,
    userId,
  }).catch((err) =>
    console.error(`[generation] Retry error for lesson ${lessonId}:`, err)
  );
}
