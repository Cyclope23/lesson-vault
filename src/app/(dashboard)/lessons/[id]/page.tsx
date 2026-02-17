export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLesson } from "@/actions/lesson.actions";
import { LessonDetailClient } from "./client";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  let lesson;
  try {
    lesson = await getLesson(id);
  } catch {
    redirect("/lessons");
  }

  const isOwner = lesson.teacherId === session.user.id;

  return (
    <LessonDetailClient
      lesson={JSON.parse(JSON.stringify(lesson))}
      isOwner={isOwner}
    />
  );
}
