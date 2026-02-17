"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateDirect } from "@/actions/generate.actions";
import { createManualLesson } from "@/actions/lesson.actions";
import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from "@/types/lesson";
import { Loader2, Sparkles, PenLine } from "lucide-react";
import { toast } from "sonner";
import { ApiKeyRequiredDialog } from "@/components/api-key-required-dialog";

interface GenerateClientProps {
  disciplines: { id: string; name: string }[];
  documents: { id: string; originalName: string }[];
  defaultDisciplineId: string | null;
  aiAvailable?: boolean;
}

export function GenerateClient({
  disciplines,
  documents,
  defaultDisciplineId,
  aiAvailable = false,
}: GenerateClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("LEZIONE");
  const [disciplineId, setDisciplineId] = useState(defaultDisciplineId || "");
  const [documentId, setDocumentId] = useState("");
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  function handleAISubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("L'argomento è obbligatorio.");
      return;
    }
    if (!disciplineId) {
      toast.error("Seleziona una disciplina.");
      return;
    }

    startTransition(async () => {
      try {
        await generateDirect({
          title: title.trim(),
          description: description.trim() || undefined,
          contentType: contentType as any,
          disciplineId,
          documentId: documentId && documentId !== "none" ? documentId : undefined,
          className: className.trim() || undefined,
        });
        toast.success("Generazione avviata! Puoi continuare a lavorare.");
        // Reset form for new generation
        setTitle("");
        setClassName("");
        setDescription("");
        setDocumentId("");
      } catch (error: any) {
        toast.error(error.message || "Errore nella generazione.");
      }
    });
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("L'argomento è obbligatorio.");
      return;
    }
    if (!disciplineId) {
      toast.error("Seleziona una disciplina.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createManualLesson({
          title: title.trim(),
          description: description.trim() || undefined,
          contentType,
          disciplineId,
          className: className.trim() || undefined,
        });
        toast.success("Contenuto creato!");
        router.push(`/lessons/${result.lessonId}`);
      } catch (error: any) {
        toast.error(error.message || "Errore nella creazione.");
      }
    });
  }

  const sharedFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Argomento *</Label>
        <Input
          id="title"
          placeholder="es. Le equazioni di secondo grado"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="className">Classe</Label>
        <Input
          id="className"
          placeholder="es. 4D"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione / istruzioni (opzionale)</Label>
        <Textarea
          id="description"
          placeholder="Indicazioni specifiche..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contentType">Tipologia *</Label>
        <Select
          value={contentType}
          onValueChange={setContentType}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {CONTENT_TYPE_LABELS[ct]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discipline">Disciplina *</Label>
        <Select
          value={disciplineId}
          onValueChange={setDisciplineId}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona disciplina" />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <Tabs defaultValue="ai">
      <TabsList className="mb-4">
        <TabsTrigger value="ai">
          <Sparkles className="mr-1.5 h-4 w-4" />
          Genera con AI
        </TabsTrigger>
        <TabsTrigger value="manual">
          <PenLine className="mr-1.5 h-4 w-4" />
          Inserisci manualmente
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ai">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleAISubmit} className="space-y-6">
              {sharedFields}

              <div className="space-y-2">
                <Label htmlFor="document">Documento di riferimento (opzionale)</Label>
                <Select
                  value={documentId}
                  onValueChange={setDocumentId}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nessun documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessun documento</SelectItem>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.originalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Se presente, il testo del documento verrà usato come contesto aggiuntivo.
                </p>
              </div>

              <div onClick={() => !aiAvailable && setApiKeyDialogOpen(true)}>
                <Button type="submit" disabled={!aiAvailable || isPending} className="w-full">
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isPending ? "Avvio generazione..." : "Genera"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="manual">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleManualSubmit} className="space-y-6">
              {sharedFields}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PenLine className="mr-2 h-4 w-4" />
                )}
                {isPending ? "Creazione in corso..." : "Crea contenuto"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <ApiKeyRequiredDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
      />
    </Tabs>
  );
}
