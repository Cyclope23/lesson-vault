"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { requestLessonPublication, setLessonPrivate } from "@/actions/lesson.actions";
import { Send, Lock, RefreshCw } from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  visibility: string;
  approvalStatus: string;
  rejectionReason: string | null;
  updatedAt: string;
  discipline: { name: string };
}

interface MyLessonsClientProps {
  lessons: LessonItem[];
}

export function MyLessonsClient({ lessons }: MyLessonsClientProps) {
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

  if (lessons.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Non hai ancora nessuna lezione.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titolo</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Visibilità</TableHead>
          <TableHead>Approvazione</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lessons.map((lesson) => (
          <TableRow key={lesson.id}>
            <TableCell className="font-medium">{lesson.title}</TableCell>
            <TableCell>{lesson.discipline.name}</TableCell>
            <TableCell>
              <VisibilityBadge visibility={lesson.visibility} />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <ApprovalStatusBadge status={lesson.approvalStatus} />
                {lesson.approvalStatus === "REJECTED" && lesson.rejectionReason && (
                  <span className="text-xs text-red-600">
                    {lesson.rejectionReason}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {new Date(lesson.updatedAt).toLocaleDateString("it-IT")}
            </TableCell>
            <TableCell className="text-right">
              <LessonActions
                lesson={lesson}
                isPending={isPending}
                onRequestPublication={handleRequestPublication}
                onSetPrivate={handleSetPrivate}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LessonActions({
  lesson,
  isPending,
  onRequestPublication,
  onSetPrivate,
}: {
  lesson: LessonItem;
  isPending: boolean;
  onRequestPublication: (id: string) => void;
  onSetPrivate: (id: string) => void;
}) {
  const { visibility, approvalStatus, id } = lesson;

  if (visibility === "PRIVATE" && approvalStatus === "NONE") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onRequestPublication(id)}
        disabled={isPending}
      >
        <Send className="mr-1 h-4 w-4" />
        Richiedi pubblicazione
      </Button>
    );
  }

  if (approvalStatus === "PENDING") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onSetPrivate(id)}
        disabled={isPending}
      >
        <Lock className="mr-1 h-4 w-4" />
        Annulla richiesta
      </Button>
    );
  }

  if (approvalStatus === "APPROVED") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onSetPrivate(id)}
        disabled={isPending}
      >
        <Lock className="mr-1 h-4 w-4" />
        Rendi privato
      </Button>
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
      </div>
    );
  }

  return null;
}
