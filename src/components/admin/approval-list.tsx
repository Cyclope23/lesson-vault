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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

interface ApprovalItem {
  id: string;
  title: string;
  updatedAt: Date;
  teacher: { firstName: string; lastName: string; email: string };
  discipline: { name: string };
}

interface ApprovalListProps {
  items: ApprovalItem[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  emptyMessage: string;
}

export function ApprovalStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">In attesa</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-500/15 text-green-700 border-green-300">Approvato</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-500/15 text-red-700 border-red-300">Rifiutato</Badge>;
    case "NONE":
      return <Badge variant="secondary">Privato</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function VisibilityBadge({ visibility }: { visibility: string }) {
  if (visibility === "PUBLIC") {
    return <Badge variant="outline">Pubblico</Badge>;
  }
  return <Badge variant="secondary">Privato</Badge>;
}

export function ApprovalList({ items, onApprove, onReject, emptyMessage }: ApprovalListProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(async () => {
      await onApprove(id);
    });
  }

  function openRejectDialog(id: string) {
    setSelectedId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  }

  function handleReject() {
    if (!selectedId || !rejectionReason.trim()) return;
    startTransition(async () => {
      await onReject(selectedId, rejectionReason.trim());
      setRejectDialogOpen(false);
      setSelectedId(null);
      setRejectionReason("");
    });
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titolo</TableHead>
            <TableHead>Docente</TableHead>
            <TableHead>Disciplina</TableHead>
            <TableHead>Data richiesta</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>
                {item.teacher.firstName} {item.teacher.lastName}
              </TableCell>
              <TableCell>{item.discipline.name}</TableCell>
              <TableCell>
                {new Date(item.updatedAt).toLocaleDateString("it-IT")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 hover:bg-green-50"
                    onClick={() => handleApprove(item.id)}
                    disabled={isPending}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Approva
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 hover:bg-red-50"
                    onClick={() => openRejectDialog(item.id)}
                    disabled={isPending}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Rifiuta
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
