"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: string;
  aiAvailable?: boolean;
}

export function MobileNav({ open, onOpenChange, role, aiAvailable }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <Sidebar role={role} aiAvailable={aiAvailable} />
      </SheetContent>
    </Sheet>
  );
}
