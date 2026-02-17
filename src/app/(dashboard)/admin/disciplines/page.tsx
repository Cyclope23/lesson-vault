export const dynamic = "force-dynamic";

import { getAllDisciplines } from "@/actions/admin.actions";
import { DisciplinesClient } from "./client";

export default async function DisciplinesPage() {
  const disciplines = await getAllDisciplines();

  return (
    <div>
      <h1 className="text-2xl font-bold">Discipline</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Gestisci le discipline dell&apos;istituto.
      </p>
      <DisciplinesClient disciplines={JSON.parse(JSON.stringify(disciplines))} />
    </div>
  );
}
