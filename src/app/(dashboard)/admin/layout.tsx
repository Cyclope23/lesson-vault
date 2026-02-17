import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    redirect("/programs");
  }

  return <>{children}</>;
}
