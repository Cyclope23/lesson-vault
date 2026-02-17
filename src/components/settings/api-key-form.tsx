"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { saveApiKey, removeApiKey, getApiKeyStatus } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ApiKeyForm() {
  const [state, formAction, isPending] = useActionState(saveApiKey, undefined);
  const [keyStatus, setKeyStatus] = useState<{
    configured: boolean;
    maskedKey: string | null;
  } | null>(null);
  const [isRemoving, startRemoveTransition] = useTransition();

  useEffect(() => {
    getApiKeyStatus().then(setKeyStatus);
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast.success("API key salvata con successo!");
      getApiKeyStatus().then(setKeyStatus);
    }
  }, [state]);

  const handleRemove = () => {
    startRemoveTransition(async () => {
      await removeApiKey();
      setKeyStatus({ configured: false, maskedKey: null });
      toast.success("API key rimossa.");
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>API Key Anthropic</CardTitle>
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
          Inserisci la tua API key Anthropic per utilizzare le funzionalità AI.
          La chiave viene cifrata e non è mai visibile in chiaro.
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
              placeholder="sk-ant-..."
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Verifica in corso..." : "Verifica e Salva"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
