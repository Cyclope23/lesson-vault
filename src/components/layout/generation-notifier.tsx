"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GenerationStatus {
  generating: { id: string; title: string }[];
  completed: { id: string; title: string }[];
  failed: { id: string; title: string; failureReason: string | null }[];
}

const POLL_INTERVAL = 5000;

export function GenerationNotifier({
  onGeneratingCountChange,
}: {
  onGeneratingCountChange?: (count: number) => void;
}) {
  const notifiedRef = useRef(new Set<string>());
  const router = useRouter();
  const [generatingCount, setGeneratingCount] = useState(0);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/generation-status");
      if (!res.ok) return;
      const data: GenerationStatus = await res.json();

      setGeneratingCount(data.generating.length);
      onGeneratingCountChange?.(data.generating.length);

      // Track generating IDs so we only notify on transition
      for (const lesson of data.generating) {
        notifiedRef.current.add(lesson.id);
      }

      // Notify completed
      for (const lesson of data.completed) {
        if (notifiedRef.current.has(lesson.id)) {
          notifiedRef.current.delete(lesson.id);
          toast.success(`"${lesson.title}" generata!`, {
            action: {
              label: "Vai alla lezione",
              onClick: () => router.push(`/lessons/${lesson.id}`),
            },
            duration: 10000,
          });
        }
      }

      // Notify failed
      for (const lesson of data.failed) {
        if (notifiedRef.current.has(lesson.id)) {
          notifiedRef.current.delete(lesson.id);
          toast.error(
            `Errore generazione "${lesson.title}": ${lesson.failureReason || "Errore sconosciuto"}`,
            {
              action: {
                label: "Dettagli",
                onClick: () => router.push(`/lessons/${lesson.id}`),
              },
              duration: 10000,
            }
          );
        }
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [onGeneratingCountChange, router]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll]);

  if (generatingCount === 0) return null;

  return null;
}

export function GeneratingBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Badge
      variant="secondary"
      className="gap-1.5 bg-yellow-500/15 text-yellow-700 border-yellow-300"
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      {count}
    </Badge>
  );
}
