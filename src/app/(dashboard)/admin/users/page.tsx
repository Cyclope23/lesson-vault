export const dynamic = "force-dynamic";

import { getAllUsers } from "@/actions/admin.actions";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./client";

export default async function UsersPage() {
  const [users, disciplines] = await Promise.all([
    getAllUsers(),
    prisma.discipline.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Gestione utenti</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Approva, gestisci e monitora gli account docenti.
      </p>
      <UsersClient
        users={JSON.parse(JSON.stringify(users))}
        disciplines={disciplines}
      />
    </div>
  );
}
