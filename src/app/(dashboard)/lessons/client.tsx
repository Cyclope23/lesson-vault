"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApprovalStatusBadge,
  VisibilityBadge,
} from "@/components/admin/approval-list";
import {
  requestLessonPublication,
  setLessonPrivate,
  deleteLesson,
} from "@/actions/lesson.actions";
import { CONTENT_TYPE_LABELS } from "@/types/lesson";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Lock,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  List,
  TreePine,
  Trash2,
  User,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Types ---

interface LessonSection {
  id: string;
  type: string;
  title: string;
  order: number;
}

interface LessonItem {
  id: string;
  title: string;
  className: string | null;
  status: string;
  contentType: string;
  visibility: string;
  approvalStatus: string;
  rejectionReason: string | null;
  updatedAt: string;
  teacher: { id: string; firstName: string; lastName: string };
  discipline: { id: string; name: string };
  content: {
    sections?: LessonSection[];
  };
}

interface LessonsClientProps {
  lessons: LessonItem[];
  currentUserId: string;
  role: string;
}

// --- Main client ---

export function LessonsClient({
  lessons,
  currentUserId,
  role,
}: LessonsClientProps) {
  const defaultFilter = role === "ADMIN" ? "all" : "mine";
  const [filter, setFilter] = useState<"mine" | "all">(defaultFilter);
  const [view, setView] = useState<"list" | "tree">("list");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRequestPublication(id: string) {
    startTransition(async () => {
      await requestLessonPublication(id);
      router.refresh();
    });
  }

  function handleSetPrivate(id: string) {
    startTransition(async () => {
      await setLessonPrivate(id);
      router.refresh();
    });
  }

  function handleDeleteLesson(id: string) {
    startTransition(async () => {
      try {
        await deleteLesson(id);
        toast.success("Lezione eliminata!");
        router.refresh();
      } catch (error: any) {
        toast.error(
          error.message || "Errore nell'eliminazione della lezione."
        );
      }
    });
  }

  const filteredLessons =
    filter === "mine"
      ? lessons.filter((l) => l.teacher.id === currentUserId)
      : lessons;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as "mine" | "all")}
        >
          <TabsList>
            <TabsTrigger value="mine">
              <User className="mr-1.5 h-4 w-4" />
              Le mie
            </TabsTrigger>
            <TabsTrigger value="all">
              <Users className="mr-1.5 h-4 w-4" />
              Tutte
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "list" | "tree")}
        >
          <TabsList>
            <TabsTrigger value="list">
              <List className="mr-1.5 h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="tree">
              <TreePine className="mr-1.5 h-4 w-4" />
              Albero
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredLessons.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {filter === "mine"
            ? "Non hai ancora nessuna lezione."
            : "Nessuna lezione disponibile."}
        </p>
      ) : view === "list" ? (
        <LessonsTable
          lessons={filteredLessons}
          currentUserId={currentUserId}
          isPending={isPending}
          onRequestPublication={handleRequestPublication}
          onSetPrivate={handleSetPrivate}
          onDelete={handleDeleteLesson}
        />
      ) : (
        <LessonsTreeView lessons={filteredLessons} />
      )}
    </div>
  );
}

// --- List view (table) ---

function LessonsTable({
  lessons,
  currentUserId,
  isPending,
  onRequestPublication,
  onSetPrivate,
  onDelete,
}: {
  lessons: LessonItem[];
  currentUserId: string;
  isPending: boolean;
  onRequestPublication: (id: string) => void;
  onSetPrivate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titolo</TableHead>
          <TableHead>Tipologia</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead>Docente</TableHead>
          <TableHead>Visibilità</TableHead>
          <TableHead>Approvazione</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lessons.map((lesson) => {
          const isOwn = lesson.teacher.id === currentUserId;
          const isGenerating = lesson.status === "GENERATING";
          const isFailed = lesson.status === "FAILED";
          return (
            <TableRow
              key={lesson.id}
              className={isGenerating ? "opacity-70" : "cursor-pointer"}
              onClick={() => !isGenerating && router.push(`/lessons/${lesson.id}`)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className={isGenerating ? "text-muted-foreground" : "text-primary hover:underline"}>
                    {lesson.title}
                  </span>
                  {isGenerating && (
                    <Badge className="gap-1 bg-yellow-500/15 text-yellow-700 border-yellow-300">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      In generazione...
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge className="gap-1 bg-red-500/15 text-red-700 border-red-300">
                      <AlertCircle className="h-3 w-3" />
                      Errore
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {CONTENT_TYPE_LABELS[lesson.contentType] ||
                    lesson.contentType}
                </Badge>
              </TableCell>
              <TableCell>{lesson.discipline.name}</TableCell>
              <TableCell>{lesson.className || "—"}</TableCell>
              <TableCell>
                {lesson.teacher.firstName} {lesson.teacher.lastName}
              </TableCell>
              <TableCell>
                <VisibilityBadge visibility={lesson.visibility} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <ApprovalStatusBadge status={lesson.approvalStatus} />
                  {lesson.approvalStatus === "REJECTED" &&
                    lesson.rejectionReason && (
                      <span className="text-xs text-red-600">
                        {lesson.rejectionReason}
                      </span>
                    )}
                </div>
              </TableCell>
              <TableCell>
                {new Date(lesson.updatedAt).toLocaleDateString("it-IT")}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                {isOwn && (
                  <LessonActions
                    lesson={lesson}
                    isPending={isPending}
                    onRequestPublication={onRequestPublication}
                    onSetPrivate={onSetPrivate}
                    onDelete={onDelete}
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// --- Tree view ---

interface TreeContentType {
  contentType: string;
  label: string;
  lessons: LessonItem[];
}

interface TreeTopic {
  title: string;
  count: number;
  types: TreeContentType[];
}

interface TreeClass {
  className: string;
  count: number;
  topics: TreeTopic[];
}

interface TreeNode {
  discipline: string;
  count: number;
  classes: TreeClass[];
}

function buildTree(lessons: LessonItem[]): TreeNode[] {
  // Discipline → className → title → contentType → lessons
  const disciplineMap = new Map<string, Map<string, Map<string, LessonItem[]>>>();

  for (const lesson of lessons) {
    const discName = lesson.discipline.name;
    const cls = lesson.className || "(Nessuna classe)";

    if (!disciplineMap.has(discName)) {
      disciplineMap.set(discName, new Map());
    }
    const classMap = disciplineMap.get(discName)!;
    if (!classMap.has(cls)) {
      classMap.set(cls, new Map());
    }
    const topicMap = classMap.get(cls)!;
    if (!topicMap.has(lesson.title)) {
      topicMap.set(lesson.title, []);
    }
    topicMap.get(lesson.title)!.push(lesson);
  }

  const tree: TreeNode[] = [];
  for (const [discipline, classMap] of disciplineMap) {
    let disciplineCount = 0;
    const classes: TreeClass[] = [];

    for (const [cls, topicMap] of classMap) {
      let classCount = 0;
      const topics: TreeTopic[] = [];

      for (const [title, topicLessons] of topicMap) {
        const typeMap = new Map<string, LessonItem[]>();
        for (const l of topicLessons) {
          if (!typeMap.has(l.contentType)) {
            typeMap.set(l.contentType, []);
          }
          typeMap.get(l.contentType)!.push(l);
        }
        const types = Array.from(typeMap.entries()).map(([ct, items]) => ({
          contentType: ct,
          label: CONTENT_TYPE_LABELS[ct] || ct,
          lessons: items.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),
        }));
        classCount += topicLessons.length;
        topics.push({ title, count: topicLessons.length, types });
      }

      disciplineCount += classCount;
      classes.push({ className: cls, count: classCount, topics });
    }

    // Sort classes: named classes first (alphabetically), "(Nessuna classe)" last
    classes.sort((a, b) => {
      if (a.className === "(Nessuna classe)") return 1;
      if (b.className === "(Nessuna classe)") return -1;
      return a.className.localeCompare(b.className);
    });

    tree.push({ discipline, count: disciplineCount, classes });
  }

  return tree.sort((a, b) => a.discipline.localeCompare(b.discipline));
}

function LessonsTreeView({ lessons }: { lessons: LessonItem[] }) {
  const tree = buildTree(lessons);

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <DisciplineNode key={node.discipline} node={node} />
      ))}
    </div>
  );
}

function DisciplineNode({ node }: { node: TreeNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-muted"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        {node.discipline}
        <Badge variant="secondary" className="ml-1 text-xs">
          {node.count}
        </Badge>
      </button>
      {open && (
        <div className="ml-4">
          {node.classes.map((cls) => (
            <ClassNode key={cls.className} classNode={cls} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassNode({ classNode }: { classNode: TreeClass }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-muted"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        {classNode.className}
        <Badge variant="secondary" className="ml-1 text-xs">
          {classNode.count}
        </Badge>
      </button>
      {open && (
        <div className="ml-4">
          {classNode.topics.map((topic) => (
            <TopicNode key={topic.title} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicNode({ topic }: { topic: TreeTopic }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        {topic.title}
        <Badge variant="secondary" className="ml-1 text-xs">
          {topic.count}
        </Badge>
      </button>
      {open && (
        <div className="ml-4">
          {topic.types.map((type) => (
            <ContentTypeNode key={type.contentType} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentTypeNode({
  type,
}: {
  type: TreeContentType;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <Badge variant="outline" className="text-xs">
          {type.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          ({type.lessons.length})
        </span>
      </button>
      {open && (
        <div className="ml-4">
          {type.lessons.map((lesson) => (
            <LeafNode key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  introduction: "Introduzione",
  explanation: "Spiegazione",
  example: "Esempio",
  exercise: "Esercizio",
  summary: "Riepilogo",
  deepening: "Approfondimento",
};

function LeafNode({ lesson }: { lesson: LessonItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const sections = (lesson.content?.sections || []).sort(
    (a, b) => a.order - b.order
  );
  const hasSections = sections.length > 0;

  return (
    <div>
      <div className="flex w-full items-center gap-1">
        {hasSections ? (
          <button
            onClick={() => setOpen(!open)}
            className="shrink-0 rounded p-0.5 hover:bg-muted"
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="inline-block w-[22px] shrink-0 text-center text-muted-foreground">
            •
          </span>
        )}
        <button
          onClick={() => router.push(`/lessons/${lesson.id}`)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted",
            "text-left"
          )}
        >
          <span className="truncate font-medium text-primary hover:underline">
            {lesson.title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            — {new Date(lesson.updatedAt).toLocaleDateString("it-IT")}
          </span>
        </button>
      </div>
      {open && hasSections && (
        <div className="ml-6 border-l pl-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center gap-2 py-1 text-xs text-muted-foreground"
            >
              <span>•</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {SECTION_TYPE_LABELS[section.type] || section.type}
              </Badge>
              <span className="truncate">{section.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Lesson actions ---

function LessonActions({
  lesson,
  isPending,
  onRequestPublication,
  onSetPrivate,
  onDelete,
}: {
  lesson: LessonItem;
  isPending: boolean;
  onRequestPublication: (id: string) => void;
  onSetPrivate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { visibility, approvalStatus, id } = lesson;

  const deleteButton = (
    <Button
      size="sm"
      variant="ghost"
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={() => onDelete(id)}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  if (visibility === "PRIVATE" && approvalStatus === "NONE") {
    return (
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRequestPublication(id)}
          disabled={isPending}
        >
          <Send className="mr-1 h-4 w-4" />
          Richiedi pubblicazione
        </Button>
        {deleteButton}
      </div>
    );
  }

  if (approvalStatus === "PENDING") {
    return (
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSetPrivate(id)}
          disabled={isPending}
        >
          <Lock className="mr-1 h-4 w-4" />
          Annulla richiesta
        </Button>
        {deleteButton}
      </div>
    );
  }

  if (approvalStatus === "APPROVED") {
    return (
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSetPrivate(id)}
          disabled={isPending}
        >
          <Lock className="mr-1 h-4 w-4" />
          Rendi privato
        </Button>
        {deleteButton}
      </div>
    );
  }

  if (approvalStatus === "REJECTED") {
    return (
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRequestPublication(id)}
          disabled={isPending}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          Richiedi di nuovo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSetPrivate(id)}
          disabled={isPending}
        >
          <Lock className="mr-1 h-4 w-4" />
          Rendi privato
        </Button>
        {deleteButton}
      </div>
    );
  }

  return deleteButton;
}
