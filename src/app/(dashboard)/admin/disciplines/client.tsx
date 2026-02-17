"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
} from "@/actions/admin.actions";

interface DisciplineItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: string;
  _count: { teachers: number; programs: number; lessons: number };
}

interface DisciplinesClientProps {
  disciplines: DisciplineItem[];
}

export function DisciplinesClient({ disciplines }: DisciplinesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DisciplineItem | null>(null);
  const [deleting, setDeleting] = useState<DisciplineItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("");

  function openCreateDialog() {
    setEditing(null);
    setName("");
    setDescription("");
    setColor("#3b82f6");
    setIcon("");
    setError(null);
    setDialogOpen(true);
  }

  function openEditDialog(discipline: DisciplineItem) {
    setEditing(discipline);
    setName(discipline.name);
    setDescription(discipline.description ?? "");
    setColor(discipline.color ?? "#3b82f6");
    setIcon(discipline.icon ?? "");
    setError(null);
    setDialogOpen(true);
  }

  function openDeleteDialog(discipline: DisciplineItem) {
    setDeleting(discipline);
    setError(null);
    setDeleteDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) {
      setError("Il nome è obbligatorio");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const data = {
          name,
          description: description || undefined,
          color: color || undefined,
          icon: icon || undefined,
        };
        if (editing) {
          await updateDiscipline(editing.id, data);
        } else {
          await createDiscipline(data);
        }
        setDialogOpen(false);
        router.refresh();
      } catch (e: any) {
        setError(e.message ?? "Errore durante il salvataggio");
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteDiscipline(deleting.id);
        setDeleteDialogOpen(false);
        setDeleting(null);
        router.refresh();
      } catch (e: any) {
        setError(e.message ?? "Errore durante l'eliminazione");
      }
    });
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-1 h-4 w-4" />
          Nuova disciplina
        </Button>
      </div>

      {disciplines.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nessuna disciplina presente. Creane una per iniziare.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colore</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Docenti</TableHead>
              <TableHead>Programmi</TableHead>
              <TableHead>Lezioni</TableHead>
              <TableHead>Creata</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disciplines.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <div
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: d.color ?? "#94a3b8" }}
                  />
                </TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="max-w-[300px] truncate text-muted-foreground">
                  {d.description ?? "—"}
                </TableCell>
                <TableCell>{d._count.teachers}</TableCell>
                <TableCell>{d._count.programs}</TableCell>
                <TableCell>{d._count.lessons}</TableCell>
                <TableCell>
                  {new Date(d.createdAt).toLocaleDateString("it-IT")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(d)}
                      disabled={isPending}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Modifica
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 hover:bg-red-50"
                      onClick={() => openDeleteDialog(d)}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Elimina
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifica disciplina" : "Nuova disciplina"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica i dati della disciplina."
                : "Inserisci i dati per la nuova disciplina."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="disc-name">Nome *</Label>
              <Input
                id="disc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Matematica"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disc-desc">Descrizione</Label>
              <Textarea
                id="disc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione opzionale..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="disc-color">Colore</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="disc-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border p-1"
                  />
                  <span className="text-sm text-muted-foreground">{color}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="disc-icon">Icona</Label>
                <Input
                  id="disc-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="es. BookOpen"
                />
              </div>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={isPending || !name.trim()}>
              {editing ? "Salva modifiche" : "Crea disciplina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina disciplina</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare la disciplina &quot;{deleting?.name}&quot;?
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
