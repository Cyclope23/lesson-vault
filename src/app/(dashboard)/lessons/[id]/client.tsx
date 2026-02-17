"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateLessonContent,
  updateLessonMeta,
  requestLessonPublication,
  setLessonPrivate,
  retryLessonGeneration,
} from "@/actions/lesson.actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTENT_TYPE_LABELS } from "@/types/lesson";
import type { LessonContent, LessonSection } from "@/types/lesson";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Save,
  Send,
  Lock,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  ApprovalStatusBadge,
  VisibilityBadge,
} from "@/components/admin/approval-list";

const SECTION_TYPES = [
  { value: "introduction", label: "Introduzione" },
  { value: "explanation", label: "Spiegazione" },
  { value: "example", label: "Esempio" },
  { value: "exercise", label: "Esercizio" },
  { value: "summary", label: "Riepilogo" },
  { value: "deepening", label: "Approfondimento" },
] as const;

function sectionTypeLabel(type: string) {
  return SECTION_TYPES.find((s) => s.value === type)?.label || type;
}

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  className: string | null;
  status: string;
  contentType: string;
  content: LessonContent;
  failureReason: string | null;
  visibility: string;
  approvalStatus: string;
  rejectionReason: string | null;
  teacherId: string;
  discipline: { id: string; name: string };
  teacher: { id: string; firstName: string; lastName: string };
  topic: {
    id: string;
    title: string;
    module: {
      name: string;
      program: { id: string; title: string };
    };
  } | null;
}

export function LessonDetailClient({
  lesson,
  isOwner,
}: {
  lesson: LessonData;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // GENERATING state — show placeholder with auto-refresh
  if (lesson.status === "GENERATING") {
    return <GeneratingPlaceholder title={lesson.title} />;
  }

  // FAILED state — show error with retry
  if (lesson.status === "FAILED") {
    return (
      <FailedView
        lesson={lesson}
        isOwner={isOwner}
        isPending={isPending}
        startTransition={startTransition}
      />
    );
  }

  return (
    <LessonEditor
      lesson={lesson}
      isOwner={isOwner}
      isPending={isPending}
      startTransition={startTransition}
    />
  );
}

function GeneratingPlaceholder({ title }: { title: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Generazione in corso...</h2>
        <p className="mt-2 text-muted-foreground">
          &ldquo;{title}&rdquo; &mdash; La pagina si aggiornerà automaticamente al completamento.
        </p>
      </div>
    </div>
  );
}

function FailedView({
  lesson,
  isOwner,
  isPending,
  startTransition,
}: {
  lesson: LessonData;
  isOwner: boolean;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const router = useRouter();

  function handleRetry() {
    startTransition(async () => {
      try {
        await retryLessonGeneration(lesson.id);
        toast.success("Generazione riavviata!");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Errore nel riavvio della generazione.");
      }
    });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Generazione fallita</h2>
        <p className="mt-2 text-muted-foreground">
          &ldquo;{lesson.title}&rdquo;
        </p>
        {lesson.failureReason && (
          <p className="mt-2 text-sm text-red-600">
            {lesson.failureReason}
          </p>
        )}
      </div>
      {isOwner && (
        <Button onClick={handleRetry} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Riprova
        </Button>
      )}
    </div>
  );
}

function LessonEditor({
  lesson,
  isOwner,
  isPending,
  startTransition,
}: {
  lesson: LessonData;
  isOwner: boolean;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || "");
  const [className, setClassName] = useState(lesson.className || "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [content, setContent] = useState<LessonContent>(lesson.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [mode, setMode] = useState<"read" | "edit">(isOwner ? "edit" : "read");

  function markChanged() {
    setHasChanges(true);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await Promise.all([
          updateLessonContent(lesson.id, content),
          updateLessonMeta(lesson.id, { title, description, className }),
        ]);
        setHasChanges(false);
        toast.success("Modifiche salvate!");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Errore nel salvataggio.");
      }
    });
  }

  function handleRequestPublication() {
    startTransition(async () => {
      try {
        await requestLessonPublication(lesson.id);
        toast.success("Richiesta di pubblicazione inviata!");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  function handleSetPrivate() {
    startTransition(async () => {
      try {
        await setLessonPrivate(lesson.id);
        toast.success("Contenuto reso privato.");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  }

  // Section editing helpers
  function updateSection(index: number, updates: Partial<LessonSection>) {
    const newSections = [...content.sections];
    newSections[index] = { ...newSections[index], ...updates };
    setContent({ ...content, sections: newSections });
    markChanged();
  }

  function removeSection(index: number) {
    const newSections = content.sections.filter((_, i) => i !== index);
    newSections.forEach((s, i) => (s.order = i));
    setContent({ ...content, sections: newSections });
    markChanged();
  }

  function moveSection(index: number, direction: "up" | "down") {
    const newSections = [...content.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];
    newSections.forEach((s, i) => (s.order = i));
    setContent({ ...content, sections: newSections });
    markChanged();
  }

  function addSection() {
    const newSection: LessonSection = {
      id: `section-${Date.now()}`,
      type: "explanation",
      title: "Nuova sezione",
      content: "",
      order: content.sections.length,
    };
    setContent({
      ...content,
      sections: [...content.sections, newSection],
    });
    markChanged();
  }

  function updateMetaArray(field: "objectives" | "prerequisites" | "keywords", value: string) {
    setContent({
      ...content,
      [field]: value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    markChanged();
  }

  const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editingTitle && isOwner && mode === "edit" ? (
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markChanged();
                }}
                className="text-2xl font-bold h-auto py-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingTitle(false)}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer"
              onClick={() => isOwner && mode === "edit" && setEditingTitle(true)}
            >
              {title}
              {isOwner && mode === "edit" && (
                <Pencil className="ml-2 inline h-4 w-4 text-muted-foreground" />
              )}
            </h1>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {CONTENT_TYPE_LABELS[lesson.contentType] || lesson.contentType}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {lesson.discipline.name}
            </span>
            {className && (
              <Badge variant="secondary">{className}</Badge>
            )}
            <VisibilityBadge visibility={lesson.visibility} />
            <ApprovalStatusBadge status={lesson.approvalStatus} />
          </div>
          {lesson.rejectionReason && (
            <p className="mt-1 text-sm text-red-600">
              Motivo rifiuto: {lesson.rejectionReason}
            </p>
          )}
          {lesson.topic && (
            <p className="mt-1 text-sm text-muted-foreground">
              Da programma:{" "}
              <Link
                href={`/programs/${lesson.topic.module.program.id}`}
                className="underline hover:text-foreground"
              >
                {lesson.topic.module.program.title}
              </Link>
              {" > "}
              {lesson.topic.module.name}
              {" > "}
              {lesson.topic.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "read" | "edit")}>
            <TabsList>
              <TabsTrigger value="read">
                <BookOpen className="mr-1.5 h-4 w-4" />
                Lettura
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value="edit">
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Modifica
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          <ExportDropdown lessonId={lesson.id} />
          {isOwner && mode === "edit" && hasChanges && (
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salva
            </Button>
          )}
          {isOwner &&
            lesson.visibility === "PRIVATE" &&
            lesson.approvalStatus === "NONE" && (
              <Button
                variant="outline"
                onClick={handleRequestPublication}
                disabled={isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Richiedi pubblicazione
              </Button>
            )}
          {isOwner && lesson.visibility === "PUBLIC" && (
            <Button
              variant="outline"
              onClick={handleSetPrivate}
              disabled={isPending}
            >
              <Lock className="mr-2 h-4 w-4" />
              Rendi privato
            </Button>
          )}
        </div>
      </div>

      {mode === "read" ? (
        /* ===== READING MODE ===== */
        <ReadingView
          title={title}
          description={description}
          className={className}
          content={content}
          sections={sortedSections}
          teacher={lesson.teacher}
          discipline={lesson.discipline}
          contentType={lesson.contentType}
        />
      ) : (
        /* ===== EDIT MODE ===== */
        <>
          {/* General info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informazioni generali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Classe</Label>
                <Input
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    markChanged();
                  }}
                  placeholder="es. 4D"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    markChanged();
                  }}
                  placeholder="Descrizione opzionale..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contenuto</h2>
              <Button variant="outline" size="sm" onClick={addSection}>
                <Plus className="mr-1 h-4 w-4" />
                Aggiungi sezione
              </Button>
            </div>
            {sortedSections.map((section, index) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Select
                        value={section.type}
                        onValueChange={(v) =>
                          updateSection(index, { type: v as LessonSection["type"] })
                        }
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTION_TYPES.map((st) => (
                            <SelectItem key={st.value} value={st.value}>
                              {st.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(index, { title: e.target.value })
                        }
                        className="h-8 text-sm font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1"
                        onClick={() => moveSection(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1"
                        onClick={() => moveSection(index, "down")}
                        disabled={index === content.sections.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1 text-red-600 hover:text-red-700"
                        onClick={() => removeSection(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="edit">
                    <TabsList className="mb-3">
                      <TabsTrigger value="edit">Modifica</TabsTrigger>
                      <TabsTrigger value="preview">Anteprima</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                      <Textarea
                        value={section.content}
                        onChange={(e) =>
                          updateSection(index, { content: e.target.value })
                        }
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <MarkdownContent content={section.content} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durata stimata (minuti)</Label>
                  <Input
                    type="number"
                    value={content.estimatedDuration || ""}
                    onChange={(e) => {
                      setContent({
                        ...content,
                        estimatedDuration: parseInt(e.target.value) || 0,
                      });
                      markChanged();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Classe target</Label>
                  <Input
                    value={content.targetGrade || ""}
                    onChange={(e) => {
                      setContent({ ...content, targetGrade: e.target.value });
                      markChanged();
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Obiettivi (uno per riga)</Label>
                <Textarea
                  value={(content.objectives || []).join("\n")}
                  onChange={(e) => updateMetaArray("objectives", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Prerequisiti (uno per riga)</Label>
                <Textarea
                  value={(content.prerequisites || []).join("\n")}
                  onChange={(e) =>
                    updateMetaArray("prerequisites", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Parole chiave (una per riga)</Label>
                <Textarea
                  value={(content.keywords || []).join("\n")}
                  onChange={(e) => updateMetaArray("keywords", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bottom save bar */}
          {hasChanges && (
            <div className="sticky bottom-4 flex justify-end">
              <Button onClick={handleSave} disabled={isPending} size="lg">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salva modifiche
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ===== Reading mode =====

function ReadingView({
  title,
  description,
  className,
  content,
  sections,
  teacher,
  discipline,
  contentType,
}: {
  title: string;
  description: string;
  className: string;
  content: LessonContent;
  sections: LessonSection[];
  teacher: { firstName: string; lastName: string };
  discipline: { name: string };
  contentType: string;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      {/* Intro block */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{teacher.firstName} {teacher.lastName}</span>
          <span>·</span>
          <span>{discipline.name}</span>
          {className && (
            <>
              <span>·</span>
              <span>{className}</span>
            </>
          )}
          <span>·</span>
          <span>{CONTENT_TYPE_LABELS[contentType] || contentType}</span>
          {content.estimatedDuration > 0 && (
            <>
              <span>·</span>
              <span>{content.estimatedDuration} min</span>
            </>
          )}
          {content.targetGrade && (
            <>
              <span>·</span>
              <span>{content.targetGrade}</span>
            </>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground italic">{description}</p>
        )}
      </div>

      {/* Objectives & Prerequisites */}
      {((content.objectives?.length ?? 0) > 0 || (content.prerequisites?.length ?? 0) > 0) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {(content.objectives?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Obiettivi
                </h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {content.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
            {(content.prerequisites?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Prerequisiti
                </h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {content.prerequisites.map((pre, i) => (
                    <li key={i}>{pre}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Sections — flowing document */}
      {sections.map((section, index) => (
        <section key={section.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs shrink-0">
              {sectionTypeLabel(section.type)}
            </Badge>
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>
          <MarkdownContent content={section.content} />
          {index < sections.length - 1 && <Separator className="mt-6" />}
        </section>
      ))}

      {/* Keywords */}
      {(content.keywords?.length ?? 0) > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Parole chiave
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {content.keywords.map((kw, i) => (
                <Badge key={i} variant="outline">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </article>
  );
}

// ===== Export dropdown =====

function ExportDropdown({ lessonId }: { lessonId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport(format: "md" | "docx") {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/export?format=${format}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Errore nel download");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const fileNameMatch = disposition.match(/filename="(.+)"/);
      const fileName = fileNameMatch?.[1] || `lezione.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || "Errore nel download");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Scarica
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("md")}>
          Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("docx")}>
          Word (.docx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===== Markdown renderer =====

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:bg-muted prose-pre:text-foreground">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
