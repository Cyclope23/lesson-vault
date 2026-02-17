export const dynamic = "force-dynamic";

import { getPendingApprovals } from "@/actions/admin.actions";
import { ApprovalsClient } from "./client";

export default async function ApprovalsPage() {
  const { lessons, programs } = await getPendingApprovals();

  return (
    <div>
      <h1 className="text-2xl font-bold">Approvazioni</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Gestisci le richieste di pubblicazione dei docenti.
      </p>
      <ApprovalsClient
        lessons={JSON.parse(JSON.stringify(lessons))}
        programs={JSON.parse(JSON.stringify(programs))}
      />
    </div>
  );
}
