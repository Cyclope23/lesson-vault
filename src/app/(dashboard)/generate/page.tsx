export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GenerateClient } from "./client";

export default async function GeneratePage() {
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
      select: { id: true, originalName: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const userDisciplineId = (session.user as any).disciplineId as string | null;
  const apiKeyConfigured = (session.user as any).apiKeyConfigured ?? false;
  const geminiAvailable = (session.user as any).geminiAvailable ?? false;
  const aiAvailable = apiKeyConfigured || geminiAvailable;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Genera contenuto</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Genera un contenuto didattico su un argomento a scelta, senza passare da un programma.
      </p>
      <GenerateClient
        disciplines={disciplines}
        documents={documents}
        defaultDisciplineId={userDisciplineId}
        aiAvailable={aiAvailable}
      />
    </div>
  );
}
