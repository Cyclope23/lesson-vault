import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function contentVisibilityFilter(userId: string, role: string) {
  if (role === "ADMIN") return {};
  return {
    OR: [
      { teacherId: userId },
      { visibility: "PUBLIC" as const, approvalStatus: "APPROVED" as const },
    ],
  };
}
