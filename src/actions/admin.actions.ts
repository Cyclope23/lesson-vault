"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Visibility, ApprovalStatus, UserStatus } from "@/generated/prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  if ((session.user as any).role !== "ADMIN") throw new Error("Accesso negato");
  return session.user.id;
}

export async function approveLesson(lessonId: string) {
  const adminId = await requireAdmin();

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      approvalStatus: "APPROVED",
      approvedById: adminId,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });
}

export async function rejectLesson(lessonId: string, reason: string) {
  const adminId = await requireAdmin();

  if (!reason.trim()) throw new Error("Il motivo del rifiuto è obbligatorio");

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      approvalStatus: "REJECTED",
      rejectionReason: reason.trim(),
      approvedById: adminId,
      approvedAt: new Date(),
    },
  });
}

export async function approveProgram(programId: string) {
  const adminId = await requireAdmin();

  await prisma.program.update({
    where: { id: programId },
    data: {
      approvalStatus: "APPROVED",
      approvedById: adminId,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });
}

export async function rejectProgram(programId: string, reason: string) {
  const adminId = await requireAdmin();

  if (!reason.trim()) throw new Error("Il motivo del rifiuto è obbligatorio");

  await prisma.program.update({
    where: { id: programId },
    data: {
      approvalStatus: "REJECTED",
      rejectionReason: reason.trim(),
      approvedById: adminId,
      approvedAt: new Date(),
    },
  });
}

export async function getPendingApprovals() {
  await requireAdmin();

  const [lessons, programs] = await Promise.all([
    prisma.lesson.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        teacher: { select: { firstName: true, lastName: true, email: true } },
        discipline: { select: { name: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.program.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        teacher: { select: { firstName: true, lastName: true, email: true } },
        discipline: { select: { name: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  return { lessons, programs };
}

interface ContentFilters {
  type?: "lesson" | "program" | "all";
  teacherId?: string;
  disciplineId?: string;
  visibility?: Visibility;
  approvalStatus?: ApprovalStatus;
}

export async function getAllContent(filters: ContentFilters = {}) {
  await requireAdmin();

  const { type = "all", teacherId, disciplineId, visibility, approvalStatus } = filters;

  const where: Record<string, unknown> = {};
  if (teacherId) where.teacherId = teacherId;
  if (disciplineId) where.disciplineId = disciplineId;
  if (visibility) where.visibility = visibility;
  if (approvalStatus) where.approvalStatus = approvalStatus;

  const include = {
    teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
    discipline: { select: { id: true, name: true } },
  };

  const [lessons, programs] = await Promise.all([
    type === "program"
      ? Promise.resolve([])
      : prisma.lesson.findMany({ where, include, orderBy: { updatedAt: "desc" } }),
    type === "lesson"
      ? Promise.resolve([])
      : prisma.program.findMany({ where, include, orderBy: { updatedAt: "desc" } }),
  ]);

  return { lessons, programs };
}

export async function getContentFilterOptions() {
  await requireAdmin();

  const [teachers, disciplines] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.discipline.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { teachers, disciplines };
}

export async function getAllUsers() {
  const adminId = await requireAdmin();

  return prisma.user.findMany({
    where: { id: { not: adminId } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      disciplineId: true,
      discipline: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const adminId = await requireAdmin();

  if (userId === adminId) throw new Error("Non puoi modificare il tuo stesso account");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new Error("Utente non trovato");
  if (user.role === "ADMIN") throw new Error("Non puoi modificare un amministratore");

  await prisma.user.update({
    where: { id: userId },
    data: { status: status as UserStatus },
  });
}

export async function setUserDiscipline(userId: string, disciplineId: string | null) {
  const adminId = await requireAdmin();

  if (userId === adminId) throw new Error("Non puoi modificare il tuo stesso account");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new Error("Utente non trovato");
  if (user.role === "ADMIN") throw new Error("Non puoi modificare un amministratore");

  if (disciplineId) {
    const discipline = await prisma.discipline.findUnique({ where: { id: disciplineId } });
    if (!discipline) throw new Error("Disciplina non trovata");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { disciplineId },
  });
}

// --- Discipline CRUD ---

export async function getAllDisciplines() {
  await requireAdmin();

  return prisma.discipline.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      icon: true,
      createdAt: true,
      _count: { select: { teachers: true, programs: true, lessons: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createDiscipline(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}) {
  await requireAdmin();

  if (!data.name.trim()) throw new Error("Il nome è obbligatorio");

  const existing = await prisma.discipline.findUnique({ where: { name: data.name.trim() } });
  if (existing) throw new Error("Esiste già una disciplina con questo nome");

  await prisma.discipline.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      color: data.color?.trim() || null,
      icon: data.icon?.trim() || null,
    },
  });
}

export async function updateDiscipline(
  disciplineId: string,
  data: { name: string; description?: string; color?: string; icon?: string }
) {
  await requireAdmin();

  if (!data.name.trim()) throw new Error("Il nome è obbligatorio");

  const discipline = await prisma.discipline.findUnique({ where: { id: disciplineId } });
  if (!discipline) throw new Error("Disciplina non trovata");

  // Check uniqueness if name changed
  if (data.name.trim() !== discipline.name) {
    const existing = await prisma.discipline.findUnique({ where: { name: data.name.trim() } });
    if (existing) throw new Error("Esiste già una disciplina con questo nome");
  }

  await prisma.discipline.update({
    where: { id: disciplineId },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      color: data.color?.trim() || null,
      icon: data.icon?.trim() || null,
    },
  });
}

export async function deleteDiscipline(disciplineId: string) {
  await requireAdmin();

  const discipline = await prisma.discipline.findUnique({
    where: { id: disciplineId },
    select: { _count: { select: { teachers: true, programs: true, lessons: true } } },
  });
  if (!discipline) throw new Error("Disciplina non trovata");

  const total = discipline._count.teachers + discipline._count.programs + discipline._count.lessons;
  if (total > 0) {
    throw new Error(
      "Non puoi eliminare una disciplina con docenti, programmi o lezioni associati. Rimuovi prima le associazioni."
    );
  }

  await prisma.discipline.delete({ where: { id: disciplineId } });
}
