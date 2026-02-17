"use client";

import { useRouter } from "next/navigation";
import { ContentTable } from "@/components/admin/content-table";
import {
  approveLesson,
  rejectLesson,
  approveProgram,
  rejectProgram,
} from "@/actions/admin.actions";

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

interface ContentClientProps {
  lessons: ContentItem[];
  programs: ContentItem[];
  filterOptions: FilterOptions;
}

export function ContentClient({ lessons, programs, filterOptions }: ContentClientProps) {
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
    <ContentTable
      lessons={lessons}
      programs={programs}
      filterOptions={filterOptions}
      onApproveLesson={handleApproveLesson}
      onRejectLesson={handleRejectLesson}
      onApproveProgram={handleApproveProgram}
      onRejectProgram={handleRejectProgram}
    />
  );
}
