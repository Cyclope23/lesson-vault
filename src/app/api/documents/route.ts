import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const disciplineId = formData.get("disciplineId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Nessun file selezionato" }, { status: 400 });
  }

  if (!disciplineId) {
    return NextResponse.json({ error: "Seleziona una disciplina" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo di file non supportato. Carica PDF, DOCX, DOC o TXT." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Il file supera il limite di 10 MB." },
      { status: 400 }
    );
  }

  // Verify discipline exists
  const discipline = await prisma.discipline.findUnique({ where: { id: disciplineId } });
  if (!discipline) {
    return NextResponse.json({ error: "Disciplina non trovata" }, { status: 400 });
  }

  // Save file to disk
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.name.split(".").pop() || "bin";
  const fileName = `${randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Create DB record
  const document = await prisma.document.create({
    data: {
      originalName: file.name,
      storagePath: filePath,
      mimeType: file.type,
      fileSize: file.size,
      status: "UPLOADED",
      teacherId: session.user.id,
      disciplineId,
    },
  });

  return NextResponse.json({ id: document.id }, { status: 201 });
}
