"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, FileText } from "lucide-react";
import { deleteDocument } from "@/actions/document.actions";

interface DocumentItem {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  discipline: { id: string; name: string };
  _count: { lessons: number };
}

interface Discipline {
  id: string;
  name: string;
}

interface DocumentsClientProps {
  documents: DocumentItem[];
  disciplines: Discipline[];
  defaultDisciplineId: string | null;
}

function DocumentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "UPLOADED":
      return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Caricato</Badge>;
    case "EXTRACTING":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Estrazione...</Badge>;
    case "EXTRACTED":
      return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Estratto</Badge>;
    case "FAILED":
      return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">Errore</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsClient({ documents, disciplines, defaultDisciplineId }: DocumentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [disciplineId, setDisciplineId] = useState(defaultDisciplineId ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openUploadDialog() {
    setSelectedFile(null);
    setUploadError(null);
    setDisciplineId(defaultDisciplineId ?? "");
    setUploadDialogOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError(null);
  }

  async function handleUpload() {
    if (!selectedFile || !disciplineId) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("disciplineId", disciplineId);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error ?? "Errore durante il caricamento");
        return;
      }

      setUploadDialogOpen(false);
      router.refresh();
    } catch {
      setUploadError("Errore di rete. Riprova.");
    } finally {
      setUploading(false);
    }
  }

  function openDeleteDialog(doc: DocumentItem) {
    setDeletingDoc(doc);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (!deletingDoc) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteDocument(deletingDoc.id);
        setDeleteDialogOpen(false);
        setDeletingDoc(null);
        router.refresh();
      } catch (e: any) {
        setDeleteError(e.message ?? "Errore durante l'eliminazione");
      }
    });
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={openUploadDialog}>
          <Upload className="mr-1 h-4 w-4" />
          Carica documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nessun documento caricato. Carica il tuo primo documento per iniziare.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Dimensione</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Risorse</TableHead>
              <TableHead>Caricato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.originalName}
                  </div>
                </TableCell>
                <TableCell>{doc.discipline.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {doc.mimeType.split("/").pop()?.toUpperCase()}
                </TableCell>
                <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                <TableCell>
                  <DocumentStatusBadge status={doc.status} />
                </TableCell>
                <TableCell>{doc._count.lessons}</TableCell>
                <TableCell>
                  {new Date(doc.createdAt).toLocaleDateString("it-IT")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 hover:bg-red-50"
                    onClick={() => openDeleteDialog(doc)}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Elimina
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carica documento</DialogTitle>
            <DialogDescription>
              Carica un documento di supporto (PDF, DOCX, DOC, TXT). Max 10 MB.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="doc-file">File *</Label>
              <input
                ref={fileInputRef}
                id="doc-file"
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-discipline">Disciplina *</Label>
              <Select value={disciplineId} onValueChange={setDisciplineId}>
                <SelectTrigger id="doc-discipline">
                  <SelectValue placeholder="Seleziona disciplina..." />
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
          </div>
          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Annulla
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !disciplineId}
            >
              {uploading ? "Caricamento..." : "Carica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina documento</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare &quot;{deletingDoc?.originalName}&quot;?
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
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
