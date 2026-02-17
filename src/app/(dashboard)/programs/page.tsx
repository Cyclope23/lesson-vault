export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contentVisibilityFilter } from "@/lib/utils";
import { ProgramsClient } from "./client";

export default async function ProgramsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const role = (session.user as any).role as string;
  const isAdmin = role === "ADMIN";

  const programs = await prisma.program.findMany({
    where: contentVisibilityFilter(userId, role),
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      discipline: { select: { name: true } },
      _count: { select: { modules: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? "Tutti i programmi" : "Programmi"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isAdmin
              ? "Visualizza tutti i programmi di disciplina."
              : "I tuoi programmi e quelli pubblicati dai colleghi."}
          </p>
        </div>
        {!isAdmin && (
          <Link
            href="/programs/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            + Nuovo programma
          </Link>
        )}
      </div>
      <div className="mt-6" />
      <ProgramsClient
        programs={JSON.parse(JSON.stringify(programs))}
        currentUserId={userId}
      />
    </div>
  );
}
