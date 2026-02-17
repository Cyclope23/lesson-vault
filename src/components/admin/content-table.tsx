"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApprovalStatusBadge, VisibilityBadge } from "./approval-list";
import { Check, X } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  visibility: string;
  approvalStatus: string;
  rejectionReason: string | null;
  updatedAt: Date;
  teacher: { id: string; firstName: string; lastName: string; email: string };
  discipline: { id: string; name: string };
}

interface FilterOptions {
  teachers: { id: string; firstName: string; lastName: string }[];
  disciplines: { id: string; name: string }[];
}

interface ContentTableProps {
  lessons: ContentItem[];
  programs: ContentItem[];
  filterOptions: FilterOptions;
  onApproveLesson: (id: string) => Promise<void>;
  onRejectLesson: (id: string, reason: string) => Promise<void>;
  onApproveProgram: (id: string) => Promise<void>;
  onRejectProgram: (id: string, reason: string) => Promise<void>;
}

export function ContentTable({
  lessons,
  programs,
  filterOptions,
  onApproveLesson,
  onRejectLesson,
  onApproveProgram,
  onRejectProgram,
}: ContentTableProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: "lesson" | "program" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Build combined list with type label
  type TaggedItem = ContentItem & { _type: "lesson" | "program" };
  let items: TaggedItem[] = [];

  if (typeFilter !== "program") {
    items = items.concat(lessons.map((l) => ({ ...l, _type: "lesson" as const })));
  }
  if (typeFilter !== "lesson") {
    items = items.concat(programs.map((p) => ({ ...p, _type: "program" as const })));
  }

  // Apply client-side filters
  if (teacherFilter !== "all") {
    items = items.filter((i) => i.teacher.id === teacherFilter);
  }
  if (disciplineFilter !== "all") {
    items = items.filter((i) => i.discipline.id === disciplineFilter);
  }
  if (visibilityFilter !== "all") {
    items = items.filter((i) => i.visibility === visibilityFilter);
  }
  if (approvalFilter !== "all") {
    items = items.filter((i) => i.approvalStatus === approvalFilter);
  }

  // Sort by update date desc
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  function handleApprove(id: string, type: "lesson" | "program") {
    startTransition(async () => {
      if (type === "lesson") await onApproveLesson(id);
      else await onApproveProgram(id);
    });
  }

  function openRejectDialog(id: string, type: "lesson" | "program") {
    setSelectedItem({ id, type });
    setRejectionReason("");
    setRejectDialogOpen(true);
  }

  function handleReject() {
    if (!selectedItem || !rejectionReason.trim()) return;
    startTransition(async () => {
      if (selectedItem.type === "lesson") await onRejectLesson(selectedItem.id, rejectionReason.trim());
      else await onRejectProgram(selectedItem.id, rejectionReason.trim());
      setRejectDialogOpen(false);
      setSelectedItem(null);
      setRejectionReason("");
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="lesson">Lezioni</SelectItem>
            <SelectItem value="program">Programmi</SelectItem>
          </SelectContent>
        </Select>

        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Docente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i docenti</SelectItem>
            {filterOptions.teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.lastName} {t.firstName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le discipline</SelectItem>
            {filterOptions.disciplines.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Visibilità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="PRIVATE">Privato</SelectItem>
            <SelectItem value="PUBLIC">Pubblico</SelectItem>
          </SelectContent>
        </Select>

        <Select value={approvalFilter} onValueChange={setApprovalFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Stato approvazione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="NONE">Nessuno</SelectItem>
            <SelectItem value="PENDING">In attesa</SelectItem>
            <SelectItem value="APPROVED">Approvato</SelectItem>
            <SelectItem value="REJECTED">Rifiutato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nessun contenuto trovato con i filtri selezionati.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Titolo</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Visibilità</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Aggiornato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item._type}-${item.id}`}>
                <TableCell>
                  <Badge variant="outline">
                    {item._type === "lesson" ? "Lezione" : "Programma"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  {item.teacher.firstName} {item.teacher.lastName}
                </TableCell>
                <TableCell>{item.discipline.name}</TableCell>
                <TableCell>
                  <VisibilityBadge visibility={item.visibility} />
                </TableCell>
                <TableCell>
                  <ApprovalStatusBadge status={item.approvalStatus} />
                </TableCell>
                <TableCell>
                  {new Date(item.updatedAt).toLocaleDateString("it-IT")}
                </TableCell>
                <TableCell className="text-right">
                  {item.approvalStatus === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(item.id, item._type)}
                        disabled={isPending}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Approva
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 hover:bg-red-50"
                        onClick={() => openRejectDialog(item.id, item._type)}
                        disabled={isPending}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Rifiuta
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta contenuto</DialogTitle>
            <DialogDescription>
              Inserisci il motivo del rifiuto. Il docente vedrà questo messaggio.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rifiuto..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectionReason.trim()}
            >
              Conferma rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
