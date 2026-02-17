import { auth } from "@/auth";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Info } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const geminiAvailable = (session?.user as any)?.geminiAvailable ?? false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="mt-1 text-muted-foreground">
          Configura il tuo account e la tua API key.
        </p>
      </div>
      <ApiKeyForm />
      {geminiAvailable && (
        <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            L&apos;amministratore ha configurato un provider AI gratuito (Google Gemini).
            Puoi usare l&apos;AI anche senza una chiave Anthropic personale, con un limite
            di 10 generazioni al giorno.
          </p>
        </div>
      )}
      <ProfileForm />
    </div>
  );
}
