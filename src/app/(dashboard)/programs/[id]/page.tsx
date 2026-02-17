export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProgram } from "@/actions/program.actions";
import { ProgramDetailClient } from "./client";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  let program;
  try {
    program = await getProgram(id);
  } catch {
    redirect("/programs");
  }

  const apiKeyConfigured = (session.user as any).apiKeyConfigured === true;
  const geminiAvailable = (session.user as any).geminiAvailable === true;
  const aiAvailable = apiKeyConfigured || geminiAvailable;

  return (
    <ProgramDetailClient
      program={JSON.parse(JSON.stringify(program))}
      aiAvailable={aiAvailable}
    />
  );
}
