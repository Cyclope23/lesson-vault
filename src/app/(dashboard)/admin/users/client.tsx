"use client";

import { useState, useTransition } from "react";
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
import { Check, X, UserCheck, Ban } from "lucide-react";
import { setUserStatus, setUserDiscipline } from "@/actions/admin.actions";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  disciplineId: string | null;
  discipline: { id: string; name: string } | null;
}

interface Discipline {
  id: string;
  name: string;
}

interface UsersClientProps {
  users: UserItem[];
  disciplines: Discipline[];
}

function UserStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">In attesa</Badge>;
    case "ACTIVE":
      return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Attivo</Badge>;
    case "SUSPENDED":
      return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">Sospeso</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function UsersClient({ users, disciplines }: UsersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("all");
  const [disciplineFilter, setDisciplineFilter] = useState("all");

  // Apply filters
  let filtered = users;
  if (statusFilter !== "all") {
    filtered = filtered.filter((u) => u.status === statusFilter);
  }
  if (disciplineFilter !== "all") {
    if (disciplineFilter === "none") {
      filtered = filtered.filter((u) => !u.disciplineId);
    } else {
      filtered = filtered.filter((u) => u.disciplineId === disciplineFilter);
    }
  }

  function handleSetStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
    startTransition(async () => {
      await setUserStatus(userId, status);
      router.refresh();
    });
  }

  function handleSetDiscipline(userId: string, value: string) {
    startTransition(async () => {
      await setUserDiscipline(userId, value === "none" ? null : value);
      router.refresh();
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="PENDING">In attesa</SelectItem>
            <SelectItem value="ACTIVE">Attivo</SelectItem>
            <SelectItem value="SUSPENDED">Sospeso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le discipline</SelectItem>
            <SelectItem value="none">Nessuna disciplina</SelectItem>
            {disciplines.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nessun utente trovato con i filtri selezionati.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Registrato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.lastName} {user.firstName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.status === "ACTIVE" ? (
                    <Select
                      value={user.disciplineId ?? "none"}
                      onValueChange={(val) => handleSetDiscipline(user.id, val)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessuna</SelectItem>
                        {disciplines.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    user.discipline?.name ?? "—"
                  )}
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("it-IT")}
                </TableCell>
                <TableCell className="text-right">
                  {user.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 hover:bg-green-50"
                        onClick={() => handleSetStatus(user.id, "ACTIVE")}
                        disabled={isPending}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Attiva
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 hover:bg-red-50"
                        onClick={() => handleSetStatus(user.id, "SUSPENDED")}
                        disabled={isPending}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Rifiuta
                      </Button>
                    </div>
                  )}
                  {user.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 hover:bg-red-50"
                      onClick={() => handleSetStatus(user.id, "SUSPENDED")}
                      disabled={isPending}
                    >
                      <Ban className="mr-1 h-4 w-4" />
                      Sospendi
                    </Button>
                  )}
                  {user.status === "SUSPENDED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 hover:bg-green-50"
                      onClick={() => handleSetStatus(user.id, "ACTIVE")}
                      disabled={isPending}
                    >
                      <UserCheck className="mr-1 h-4 w-4" />
                      Riattiva
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
