"use client";

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

interface LessonItem {
  id: string;
  title: string;
  visibility: string;
  approvalStatus: string;
  updatedAt: string;
  teacher: { firstName: string; lastName: string };
  discipline: { name: string };
}

interface LessonsClientProps {
  lessons: LessonItem[];
}

export function LessonsClient({ lessons }: LessonsClientProps) {
  if (lessons.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nessuna lezione disponibile.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titolo</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Docente</TableHead>
          <TableHead>Visibilità</TableHead>
          <TableHead>Approvazione</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lessons.map((lesson) => (
          <TableRow key={lesson.id}>
            <TableCell className="font-medium">{lesson.title}</TableCell>
            <TableCell>{lesson.discipline.name}</TableCell>
            <TableCell>
              {lesson.teacher.firstName} {lesson.teacher.lastName}
            </TableCell>
            <TableCell>
              <VisibilityBadge visibility={lesson.visibility} />
            </TableCell>
            <TableCell>
              <ApprovalStatusBadge status={lesson.approvalStatus} />
            </TableCell>
            <TableCell>
              {new Date(lesson.updatedAt).toLocaleDateString("it-IT")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
