"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface ApiKeyRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyRequiredDialog({
  open,
  onOpenChange,
}: ApiKeyRequiredDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>AI non disponibile</DialogTitle>
          </div>
          <DialogDescription>
            Per utilizzare le funzionalit&agrave; AI puoi configurare la tua
            API key Anthropic nelle impostazioni, oppure chiedere
            all&apos;amministratore di attivare il provider AI gratuito (Google Gemini).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={() => router.push("/settings")}>
            Vai alle impostazioni
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
