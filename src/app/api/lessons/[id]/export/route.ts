import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contentVisibilityFilter } from "@/lib/utils";
import {
  lessonToMarkdown,
  lessonToDocx,
  sanitizeFileName,
} from "@/services/lesson-export";
import type { LessonContent } from "@/types/lesson";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");

  if (format !== "md" && format !== "docx") {
    return NextResponse.json(
      { error: "Formato non valido. Usa 'md' o 'docx'." },
      { status: 400 },
    );
  }

  const userId = session.user.id;
  const role = (session.user as any).role as string;

  const lesson = await prisma.lesson.findUnique({
    where: {
      id,
      ...contentVisibilityFilter(userId, role),
    },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      discipline: { select: { name: true } },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lezione non trovata" }, { status: 404 });
  }

  if (lesson.status === "GENERATING" || lesson.status === "FAILED") {
    return NextResponse.json(
      { error: "La lezione non è ancora disponibile per il download." },
      { status: 400 },
    );
  }

  const exportData = {
    title: lesson.title,
    description: lesson.description,
    contentType: lesson.contentType,
    content: lesson.content as unknown as LessonContent,
    teacher: lesson.teacher,
    discipline: lesson.discipline,
  };

  const baseName = sanitizeFileName(lesson.title) || "lezione";

  if (format === "md") {
    const markdown = lessonToMarkdown(exportData);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.md"`,
      },
    });
  }

  // docx
  const buffer = await lessonToDocx(exportData);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${baseName}.docx"`,
    },
  });
}

/**
 * POST handler: DOCX export with embedded mind map PNG image.
 * Body: { mindMapImage: string } (base64 encoded PNG)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;
  const role = (session.user as any).role as string;

  let body: { mindMapImage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  if (!body.mindMapImage) {
    return NextResponse.json({ error: "mindMapImage mancante" }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: {
      id,
      ...contentVisibilityFilter(userId, role),
    },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      discipline: { select: { name: true } },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lezione non trovata" }, { status: 404 });
  }

  if (lesson.status === "GENERATING" || lesson.status === "FAILED") {
    return NextResponse.json(
      { error: "La lezione non è ancora disponibile per il download." },
      { status: 400 },
    );
  }

  const exportData = {
    title: lesson.title,
    description: lesson.description,
    contentType: lesson.contentType,
    content: lesson.content as unknown as LessonContent,
    teacher: lesson.teacher,
    discipline: lesson.discipline,
  };

  const pngBuffer = Buffer.from(body.mindMapImage, "base64");
  const baseName = sanitizeFileName(lesson.title) || "lezione";
  const buffer = await lessonToDocx(exportData, pngBuffer);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${baseName}.docx"`,
    },
  });
}
