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
import { createProgram } from "@/actions/program.actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NewProgramClientProps {
  disciplines: { id: string; name: string }[];
  documents: { id: string; originalName: string; mimeType: string }[];
  defaultDisciplineId: string | null;
}

export function NewProgramClient({
  disciplines,
  documents,
  defaultDisciplineId,
}: NewProgramClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [className, setClassName] = useState("");
  const [disciplineId, setDisciplineId] = useState(defaultDisciplineId || "");
  const [documentId, setDocumentId] = useState("");
  const [rawContent, setRawContent] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !schoolYear.trim() || !className.trim() || !disciplineId) {
      toast.error("Compila tutti i campi obbligatori.");
      return;
    }

    if (!documentId && !rawContent.trim()) {
      toast.error("Allega un documento oppure inserisci il testo del programma.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createProgram({
          title: title.trim(),
          schoolYear: schoolYear.trim(),
          className: className.trim(),
          disciplineId,
          documentId: documentId || undefined,
          rawContent: rawContent.trim() || undefined,
        });
        toast.success("Programma creato!");
        router.push(`/programs/${result.id}`);
      } catch (error: any) {
        toast.error(error.message || "Errore nella creazione del programma.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              placeholder="es. Programma di Informatica 3A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">Anno scolastico *</Label>
            <Input
              id="schoolYear"
              placeholder="es. 2025/2026"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="className">Classe *</Label>
            <Input
              id="className"
              placeholder="es. 4D"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={isPending}
            />
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

          <div className="space-y-2">
            <Label htmlFor="document">Documento (opzionale)</Label>
            <Select
              value={documentId}
              onValueChange={setDocumentId}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un documento caricato" />
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
              Il testo verrà estratto automaticamente dal documento.
            </p>
          </div>

          {!documentId || documentId === "none" ? (
            <div className="space-y-2">
              <Label htmlFor="rawContent">Contenuto del programma *</Label>
              <Textarea
                id="rawContent"
                placeholder="Incolla qui il testo del programma di disciplina..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                rows={12}
                disabled={isPending}
              />
            </div>
          ) : null}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crea programma
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
