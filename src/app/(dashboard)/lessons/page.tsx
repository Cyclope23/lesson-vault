export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contentVisibilityFilter } from "@/lib/utils";
import { LessonsClient } from "./client";

export default async function LessonsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const role = (session.user as any).role as string;

  const lessons = await prisma.lesson.findMany({
    where: contentVisibilityFilter(userId, role),
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      discipline: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Lezioni</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Gestisci e consulta le lezioni.
      </p>
      <LessonsClient
        lessons={JSON.parse(JSON.stringify(lessons))}
        currentUserId={userId}
        role={role}
      />
    </div>
  );
}
