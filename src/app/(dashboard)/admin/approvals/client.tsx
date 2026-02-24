"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalList } from "@/components/admin/approval-list";
import {
  approveLesson,
  rejectLesson,
  approveProgram,
  rejectProgram,
} from "@/actions/admin.actions";

interface ApprovalItem {
  id: string;
  title: string;
  updatedAt: Date;
  teacher: { firstName: string; lastName: string; email: string };
  discipline: { name: string };
}

interface ApprovalsClientProps {
  lessons: ApprovalItem[];
  programs: ApprovalItem[];
}

export function ApprovalsClient({ lessons, programs }: ApprovalsClientProps) {
  const router = useRouter();

  async function handleApproveLesson(id: string) {
    await approveLesson(id);
    router.refresh();
  }

  async function handleRejectLesson(id: string, reason: string) {
    await rejectLesson(id, reason);
    router.refresh();
  }

  async function handleApproveProgram(id: string) {
    await approveProgram(id);
    router.refresh();
  }

  async function handleRejectProgram(id: string, reason: string) {
    await rejectProgram(id, reason);
    router.refresh();
  }

  return (
    <Tabs defaultValue="lessons">
      <TabsList>
        <TabsTrigger value="lessons">
          Risorse {lessons.length > 0 && `(${lessons.length})`}
        </TabsTrigger>
        <TabsTrigger value="programs">
          Programmi {programs.length > 0 && `(${programs.length})`}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="lessons">
        <ApprovalList
          items={lessons}
          onApprove={handleApproveLesson}
          onReject={handleRejectLesson}
          emptyMessage="Nessuna risorsa in attesa di approvazione."
        />
      </TabsContent>
      <TabsContent value="programs">
        <ApprovalList
          items={programs}
          onApprove={handleApproveProgram}
          onReject={handleRejectProgram}
          emptyMessage="Nessun programma in attesa di approvazione."
        />
      </TabsContent>
    </Tabs>
  );
}
