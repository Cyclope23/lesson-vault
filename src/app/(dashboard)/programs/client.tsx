"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import {
  requestProgramPublication,
  setProgramPrivate,
} from "@/actions/program.actions";
import { Send, Lock, RefreshCw } from "lucide-react";

function ProgramStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Bozza</Badge>;
    case "PARSING":
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-300">Analisi...</Badge>;
    case "PARSED":
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-300">Analizzato</Badge>;
    case "GENERATING":
      return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">Generazione...</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500/15 text-green-700 border-green-300">Completato</Badge>;
    case "FAILED":
      return <Badge className="bg-red-500/15 text-red-700 border-red-300">Errore</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

interface ProgramItem {
  id: string;
  title: string;
  schoolYear: string;
  className: string;
  status: string;
  visibility: string;
  approvalStatus: string;
  rejectionReason: string | null;
  updatedAt: string;
  teacher: { id: string; firstName: string; lastName: string };
  discipline: { name: string };
  _count: { modules: number };
}

interface ProgramsClientProps {
  programs: ProgramItem[];
  currentUserId: string;
}

export function ProgramsClient({ programs, currentUserId }: ProgramsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRequestPublication(id: string) {
    startTransition(async () => {
      await requestProgramPublication(id);
      router.refresh();
    });
  }

  function handleSetPrivate(id: string) {
    startTransition(async () => {
      await setProgramPrivate(id);
      router.refresh();
    });
  }

  if (programs.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nessun programma disponibile.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titolo</TableHead>
          <TableHead>Anno</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Docente</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Visibilità</TableHead>
          <TableHead>Approvazione</TableHead>
          <TableHead>Moduli</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programs.map((program) => {
          const isOwner = program.teacher.id === currentUserId;
          return (
            <TableRow
              key={program.id}
              className="cursor-pointer"
              onClick={() => isOwner && router.push(`/programs/${program.id}`)}
            >
              <TableCell className="font-medium">
                {isOwner ? (
                  <span className="text-primary hover:underline">{program.title}</span>
                ) : (
                  program.title
                )}
              </TableCell>
              <TableCell>{program.schoolYear}</TableCell>
              <TableCell>{program.className}</TableCell>
              <TableCell>{program.discipline.name}</TableCell>
              <TableCell>
                {program.teacher.firstName} {program.teacher.lastName}
              </TableCell>
              <TableCell>
                <ProgramStatusBadge status={program.status} />
              </TableCell>
              <TableCell>
                <VisibilityBadge visibility={program.visibility} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <ApprovalStatusBadge status={program.approvalStatus} />
                  {program.approvalStatus === "REJECTED" && program.rejectionReason && (
                    <span className="text-xs text-red-600">
                      {program.rejectionReason}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{program._count.modules}</TableCell>
              <TableCell>
                {new Date(program.updatedAt).toLocaleDateString("it-IT")}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                {isOwner && (
                  <ProgramActions
                    program={program}
                    isPending={isPending}
                    onRequestPublication={handleRequestPublication}
                    onSetPrivate={handleSetPrivate}
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

function ProgramActions({
  program,
  isPending,
  onRequestPublication,
  onSetPrivate,
}: {
  program: ProgramItem;
  isPending: boolean;
  onRequestPublication: (id: string) => void;
  onSetPrivate: (id: string) => void;
}) {
  const { visibility, approvalStatus, id } = program;

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
