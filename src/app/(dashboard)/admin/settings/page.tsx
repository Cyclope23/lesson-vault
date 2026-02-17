import { AdminSettingsClient } from "./client";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni sistema</h1>
        <p className="mt-1 text-muted-foreground">
          Configura i servizi AI e visualizza le statistiche di utilizzo.
        </p>
      </div>
      <AdminSettingsClient />
    </div>
  );
}
