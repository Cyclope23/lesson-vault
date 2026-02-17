"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  getGeminiKeyStatus,
  saveGeminiKey,
  removeGeminiKey,
  getGeminiUsageStats,
} from "@/actions/admin-settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Trash2, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export function AdminSettingsClient() {
  const [state, formAction, isPending] = useActionState(saveGeminiKey, undefined);
  const [keyStatus, setKeyStatus] = useState<{
    configured: boolean;
    maskedKey: string | null;
  } | null>(null);
  const [usageStats, setUsageStats] = useState<{
    todayCount: number;
    totalCount: number;
  } | null>(null);
  const [isRemoving, startRemoveTransition] = useTransition();

  useEffect(() => {
    getGeminiKeyStatus().then(setKeyStatus);
    getGeminiUsageStats().then(setUsageStats);
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast.success("API key Gemini salvata con successo!");
      getGeminiKeyStatus().then(setKeyStatus);
    }
  }, [state]);

  const handleRemove = () => {
    startRemoveTransition(async () => {
      await removeGeminiKey();
      setKeyStatus({ configured: false, maskedKey: null });
      toast.success("API key Gemini rimossa.");
    });
  };

  return (
    <>
      {/* Gemini API Key Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Google Gemini API Key</CardTitle>
            </div>
            {keyStatus?.configured ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Configurata
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Non configurata
              </Badge>
            )}
          </div>
          <CardDescription>
            Configura una API key Google Gemini per offrire generazione AI gratuita
            ai docenti senza chiave Anthropic personale. Ogni docente ha un limite
            di 10 generazioni al giorno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keyStatus?.configured && keyStatus.maskedKey && (
            <div className="mb-4 flex items-center justify-between rounded-md border bg-muted/50 p-3">
              <code className="text-sm">{keyStatus.maskedKey}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Rimuovi
              </Button>
            </div>
          )}
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {keyStatus?.configured ? "Aggiorna API Key" : "API Key"}
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="AIza..."
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Verifica in corso..." : "Verifica e Salva"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Usage Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Statistiche utilizzo Gemini</CardTitle>
          </div>
          <CardDescription>
            Utilizzo complessivo del provider AI gratuito da parte dei docenti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border p-4 text-center">
              <p className="text-3xl font-bold">{usageStats?.todayCount ?? "..."}</p>
              <p className="text-sm text-muted-foreground">Generazioni oggi</p>
            </div>
            <div className="rounded-md border p-4 text-center">
              <p className="text-3xl font-bold">{usageStats?.totalCount ?? "..."}</p>
              <p className="text-sm text-muted-foreground">Generazioni totali</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
