export const dynamic = "force-dynamic";

import { getAllContent, getContentFilterOptions } from "@/actions/admin.actions";
import { ContentClient } from "./client";

export default async function ContentPage() {
  const [{ lessons, programs }, filterOptions] = await Promise.all([
    getAllContent(),
    getContentFilterOptions(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Contenuti</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Esplora tutti i contenuti di tutti i docenti.
      </p>
      <ContentClient
        lessons={JSON.parse(JSON.stringify(lessons))}
        programs={JSON.parse(JSON.stringify(programs))}
        filterOptions={filterOptions}
      />
    </div>
  );
}
