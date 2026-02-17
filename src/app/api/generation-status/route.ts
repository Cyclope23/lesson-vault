import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const userId = session.user.id;
  const recentThreshold = new Date(Date.now() - 60_000);

  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId: userId,
      OR: [
        { status: "GENERATING" },
        { status: "DRAFT", updatedAt: { gte: recentThreshold } },
        { status: "FAILED", updatedAt: { gte: recentThreshold } },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      failureReason: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const generating = lessons
    .filter((l) => l.status === "GENERATING")
    .map((l) => ({ id: l.id, title: l.title }));

  const completed = lessons
    .filter((l) => l.status === "DRAFT")
    .map((l) => ({ id: l.id, title: l.title }));

  const failed = lessons
    .filter((l) => l.status === "FAILED")
    .map((l) => ({ id: l.id, title: l.title, failureReason: l.failureReason }));

  return NextResponse.json({ generating, completed, failed });
}
