export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewProgramClient } from "./client";

export default async function NewProgramPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user as any).role as string;
  if (role !== "TEACHER") redirect("/programs");

  const [disciplines, documents] = await Promise.all([
    prisma.discipline.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      where: { teacherId: session.user.id },
      select: { id: true, originalName: true, mimeType: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Pre-select user's discipline if set
  const userDisciplineId = (session.user as any).disciplineId as string | null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Nuovo programma</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Crea un nuovo programma di disciplina. Puoi allegare un documento o inserire il testo direttamente.
      </p>
      <NewProgramClient
        disciplines={disciplines}
        documents={documents}
        defaultDisciplineId={userDisciplineId}
      />
    </div>
  );
}
