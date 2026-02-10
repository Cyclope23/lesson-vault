import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MyLessonsClient } from "./client";

export default async function MyLessonsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lessons = await prisma.lesson.findMany({
    where: { teacherId: session.user.id },
    include: {
      discipline: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Le mie lezioni</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Gestisci le tue lezioni e la loro visibilità.
      </p>
      <MyLessonsClient lessons={JSON.parse(JSON.stringify(lessons))} />
    </div>
  );
}
