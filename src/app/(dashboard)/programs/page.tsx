import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProgramsClient } from "./client";

export default async function ProgramsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const role = (session.user as any).role as string;
  const isAdmin = role === "ADMIN";

  const programs = await prisma.program.findMany({
    where: isAdmin ? {} : { teacherId: userId },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      discipline: { select: { name: true } },
      _count: { select: { modules: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {isAdmin ? "Tutti i programmi" : "I miei programmi"}
      </h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        {isAdmin
          ? "Visualizza tutti i programmi di disciplina."
          : "Gestisci i tuoi programmi di disciplina."}
      </p>
      <ProgramsClient
        programs={JSON.parse(JSON.stringify(programs))}
        isOwner={!isAdmin}
      />
    </div>
  );
}
