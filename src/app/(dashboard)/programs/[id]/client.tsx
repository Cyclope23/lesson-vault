"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseProgramAction,
  generateTopicLesson,
  addModule,
  updateModule,
  deleteModule,
  addTopic,
  updateTopic,
  deleteTopic,
  deleteTopicLesson,
} from "@/actions/program.actions";
import { generateDirect } from "@/actions/generate.actions";
import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from "@/types/lesson";
import type { ContentType } from "@/generated/prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  Pencil,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { ApiKeyRequiredDialog } from "@/components/api-key-required-dialog";

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  order: number;
  status: string;
  contentType: string;
  lesson: { id: string; title: string } | null;
}

interface ModuleItem {
  id: string;
  name: string;
  description: string | null;
  order: number;
  topics: TopicItem[];
}

interface ProgramData {
  id: string;
  title: string;
  schoolYear: string;
  className: string;
  status: string;
  rawContent: string | null;
  discipline: { id: string; name: string };
  teacher: { id: string; firstName: string; lastName: string };
  modules: ModuleItem[];
}

function ProgramStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Bozza</Badge>;
    case "PARSING":
      return (
        <Badge className="bg-blue-500/15 text-blue-700 border-blue-300">
          Analisi in corso...
        </Badge>
      );
    case "PARSED":
      return (
        <Badge className="bg-blue-500/15 text-blue-700 border-blue-300">
          Analizzato
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-green-500/15 text-green-700 border-green-300">
          Completato
        </Badge>
      );
    case "FAILED":
      return (
        <Badge className="bg-red-500/15 text-red-700 border-red-300">
          Errore
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TopicStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary">In attesa</Badge>;
    case "GENERATING":
      return (
        <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">
          Generazione...
        </Badge>
      );
    case "GENERATED":
      return (
        <Badge className="bg-green-500/15 text-green-700 border-green-300">
          Generato
        </Badge>
      );
    case "FAILED":
      return (
        <Badge className="bg-red-500/15 text-red-700 border-red-300">
          Errore
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ProgramDetailClient({
  program,
  aiAvailable = false,
}: {
  program: ProgramData;
  aiAvailable?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  function handleParse() {
    startTransition(async () => {
      try {
        await parseProgramAction(program.id);
        toast.success("Programma analizzato con successo!");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Errore nell'analisi del programma.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{program.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-muted-foreground">
            <span>{program.schoolYear}</span>
            <span>·</span>
            <span>{program.className}</span>
            <span>·</span>
            <span>{program.discipline.name}</span>
            <ProgramStatusBadge status={program.status} />
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/programs">Torna ai programmi</Link>
        </Button>
      </div>

      {/* DRAFT state: show parse button */}
      {program.status === "DRAFT" && program.rawContent && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-center text-muted-foreground">
              Il programma contiene del testo ma non è ancora stato analizzato.
              Clicca il pulsante per estrarre moduli e argomenti con l&apos;AI.
            </p>
            <div onClick={() => !aiAvailable && setApiKeyDialogOpen(true)}>
              <Button onClick={handleParse} disabled={!aiAvailable || isPending} size="lg">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analizza programma
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PARSING state */}
      {program.status === "PARSING" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">
              Analisi in corso... Potrebbe richiedere qualche minuto.
            </p>
          </CardContent>
        </Card>
      )}

      {/* FAILED state */}
      {program.status === "FAILED" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-red-600">
              L&apos;analisi del programma è fallita.
            </p>
            <div onClick={() => !aiAvailable && setApiKeyDialogOpen(true)}>
              <Button onClick={handleParse} disabled={!aiAvailable || isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Riprova
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PARSED/COMPLETED: show editable structure */}
      {(program.status === "PARSED" || program.status === "COMPLETED") && (
        <ModulesEditor
          programId={program.id}
          disciplineId={program.discipline.id}
          className={program.className}
          modules={program.modules}
          isPending={isPending}
          startTransition={startTransition}
          onRefresh={() => router.refresh()}
          aiAvailable={aiAvailable}
        />
      )}

      <ApiKeyRequiredDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
      />
    </div>
  );
}

function ModulesEditor({
  programId,
  disciplineId,
  className,
  modules,
  isPending,
  startTransition,
  onRefresh,
  aiAvailable,
}: {
  programId: string;
  disciplineId: string;
  className: string;
  modules: ModuleItem[];
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onRefresh: () => void;
  aiAvailable: boolean;
}) {
  const [newModuleName, setNewModuleName] = useState("");

  function handleAddModule() {
    if (!newModuleName.trim()) return;
    startTransition(async () => {
      try {
        await addModule(programId, newModuleName.trim());
        setNewModuleName("");
        toast.success("Modulo aggiunto!");
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      {modules.map((mod) => (
        <ModuleCard
          key={mod.id}
          module={mod}
          disciplineId={disciplineId}
          className={className}
          isPending={isPending}
          startTransition={startTransition}
          onRefresh={onRefresh}
          aiAvailable={aiAvailable}
        />
      ))}

      {/* Add module */}
      <Card>
        <CardContent className="flex items-center gap-2 py-4">
          <Input
            placeholder="Nome nuovo modulo..."
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddModule();
              }
            }}
          />
          <Button
            variant="outline"
            onClick={handleAddModule}
            disabled={isPending || !newModuleName.trim()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Aggiungi modulo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ModuleCard({
  module: mod,
  disciplineId,
  className,
  isPending,
  startTransition,
  onRefresh,
  aiAvailable,
}: {
  module: ModuleItem;
  disciplineId: string;
  className: string;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onRefresh: () => void;
  aiAvailable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(mod.name);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  function handleSaveName() {
    if (!editName.trim()) return;
    startTransition(async () => {
      try {
        await updateModule(mod.id, { name: editName.trim() });
        setEditing(false);
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteModule(mod.id);
        toast.success("Modulo eliminato!");
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  function handleAddTopic() {
    if (!newTopicTitle.trim()) return;
    startTransition(async () => {
      try {
        await addTopic(mod.id, newTopicTitle.trim());
        setNewTopicTitle("");
        toast.success("Argomento aggiunto!");
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isPending}
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setEditing(false);
                    setEditName(mod.name);
                  }
                }}
              />
              <Button size="sm" variant="ghost" onClick={handleSaveName} disabled={isPending}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setEditName(mod.name);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CardTitle className="flex items-center gap-2 text-lg">
              {mod.name}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </CardTitle>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {mod.topics.map((topic) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            disciplineId={disciplineId}
            className={className}
            onRefresh={onRefresh}
            aiAvailable={aiAvailable}
          />
        ))}

        {/* Add topic */}
        <div className="flex items-center gap-2 pt-2">
          <Input
            placeholder="Nuovo argomento..."
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            disabled={isPending}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTopic();
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddTopic}
            disabled={isPending || !newTopicTitle.trim()}
          >
            <Plus className="h-3 w-3 mr-1" />
            Aggiungi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GenerateDialog({
  open,
  onOpenChange,
  topicTitle,
  contentTypeLabel,
  initialDescription,
  isPending,
  onGenerate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicTitle: string;
  contentTypeLabel: string;
  initialDescription: string;
  isPending: boolean;
  onGenerate: (description: string) => void;
}) {
  const [description, setDescription] = useState(initialDescription);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setDescription(initialDescription);
    }
    prevOpenRef.current = open;
  }, [open, initialDescription]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Genera: &ldquo;{topicTitle}&rdquo;</DialogTitle>
          <DialogDescription>
            Tipologia: {contentTypeLabel}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Istruzioni per la generazione
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. Usa C++ per gli esempi di codice. Difficoltà media. Focus su esercizi pratici..."
            rows={4}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Specifica requisiti: linguaggio di programmazione, livello di difficoltà, focus specifici...
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annulla
          </Button>
          <Button onClick={() => onGenerate(description)} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-4 w-4" />
            )}
            Genera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TopicRow({
  topic,
  disciplineId,
  className,
  onRefresh,
  aiAvailable,
}: {
  topic: TopicItem;
  disciplineId: string;
  className: string;
  onRefresh: () => void;
  aiAvailable: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateDialogContentType, setGenerateDialogContentType] = useState<ContentType | null>(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  function handleSaveTitle() {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      try {
        await updateTopic(topic.id, { title: editTitle.trim() });
        setEditing(false);
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  function handleChangeContentType(value: string) {
    startTransition(async () => {
      try {
        await updateTopic(topic.id, { contentType: value as any });
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  function openGenerateDialog(contentType?: ContentType) {
    setGenerateDialogContentType(contentType ?? null);
    setGenerateDialogOpen(true);
  }

  function handleGenerateWithInstructions(description: string) {
    startTransition(async () => {
      try {
        // Persist description if changed
        const trimmed = description.trim();
        const currentDesc = topic.description || "";
        if (trimmed !== currentDesc.trim()) {
          await updateTopic(topic.id, { description: trimmed });
        }

        if (generateDialogContentType) {
          // "Genera altro" flow — generateDirect
          await generateDirect({
            title: topic.title,
            description: trimmed || undefined,
            contentType: generateDialogContentType,
            disciplineId,
            className,
          });
        } else {
          // Primary generate flow — generateTopicLesson
          await generateTopicLesson(topic.id);
        }
        toast.success("Generazione avviata!");
        setGenerateDialogOpen(false);
        onRefresh();
      } catch (error: any) {
        toast.error(error.message || "Errore nella generazione.");
        setGenerateDialogOpen(false);
        onRefresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTopic(topic.id);
        toast.success("Argomento eliminato!");
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  function handleDeleteLesson() {
    startTransition(async () => {
      try {
        await deleteTopicLesson(topic.id);
        toast.success("Risorsa eliminata!");
        onRefresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  const dialogContentType = generateDialogContentType ?? (topic.contentType as ContentType);

  return (
    <>
      <div className="rounded-md border p-2 text-sm">
        <div className="flex items-center gap-2">
          {/* Title */}
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isPending}
                  className="h-7 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") {
                      setEditing(false);
                      setEditTitle(topic.title);
                    }
                  }}
                />
                <Button size="sm" variant="ghost" onClick={handleSaveTitle} disabled={isPending} className="h-7 px-1">
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-1"
                  onClick={() => {
                    setEditing(false);
                    setEditTitle(topic.title);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span
                className="cursor-pointer hover:underline"
                onClick={() => setEditing(true)}
              >
                {topic.title}
              </span>
            )}
          </div>

          {/* Content type select */}
          <Select
            value={topic.contentType}
            onValueChange={handleChangeContentType}
            disabled={isPending || topic.status === "GENERATED" || topic.status === "GENERATING"}
          >
            <SelectTrigger className="h-7 w-48 text-xs">
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

          {/* Status */}
          <TopicStatusBadge status={topic.status} />

          {/* Actions */}
          {(topic.status === "PENDING" || topic.status === "FAILED") && (
            <>
              <div onClick={() => !aiAvailable && setApiKeyDialogOpen(true)}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => openGenerateDialog()}
                  disabled={!aiAvailable || isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-3 w-3" />
                  )}
                  {topic.status === "FAILED" ? "Riprova" : "Genera"}
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-1 text-red-600 hover:text-red-700"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}

          {topic.status === "GENERATING" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {topic.status === "GENERATED" && topic.lesson && (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                <Link href={`/lessons/${topic.lesson.id}`}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Vedi
                </Link>
              </Button>
              {aiAvailable ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={isPending}>
                      {isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-1 h-3 w-3" />
                      )}
                      Genera altro
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => openGenerateDialog(topic.contentType as ContentType)}
                    >
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Rigenera {CONTENT_TYPE_LABELS[topic.contentType]}
                    </DropdownMenuItem>
                    {CONTENT_TYPES.filter((ct) => ct !== topic.contentType).map((ct) => (
                      <DropdownMenuItem
                        key={ct}
                        onClick={() => openGenerateDialog(ct as ContentType)}
                      >
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        {CONTENT_TYPE_LABELS[ct]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div onClick={() => setApiKeyDialogOpen(true)}>
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled>
                    <Plus className="mr-1 h-3 w-3" />
                    Genera altro
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-1 text-red-600 hover:text-red-700"
                onClick={handleDeleteLesson}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {/* Description preview */}
        {topic.description && !editing && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p
                  className="mt-1 ml-0.5 text-xs text-muted-foreground truncate max-w-md cursor-pointer hover:text-foreground"
                  onClick={() => openGenerateDialog()}
                >
                  <MessageSquare className="inline mr-1 h-3 w-3 align-text-bottom" />
                  {topic.description}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm">
                <p className="text-xs whitespace-pre-wrap">{topic.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <GenerateDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        topicTitle={topic.title}
        contentTypeLabel={CONTENT_TYPE_LABELS[dialogContentType] || dialogContentType}
        initialDescription={topic.description || ""}
        isPending={isPending}
        onGenerate={handleGenerateWithInstructions}
      />

      <ApiKeyRequiredDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
      />
    </>
  );
}
