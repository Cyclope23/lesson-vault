export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMyDocuments } from "@/actions/document.actions";
import { DocumentsClient } from "./client";

export default async function DocumentsPage() {
  const session = await auth();
  const disciplineId = (session?.user as any)?.disciplineId as string | null;

  const [documents, disciplines] = await Promise.all([
    getMyDocuments(),
    prisma.discipline.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Documenti</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Gestisci i tuoi documenti di supporto.
      </p>
      <DocumentsClient
        documents={JSON.parse(JSON.stringify(documents))}
        disciplines={disciplines}
        defaultDisciplineId={disciplineId}
      />
    </div>
  );
}
