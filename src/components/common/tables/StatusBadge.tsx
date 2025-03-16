
import React from "react";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  colorMap: Record<string, string>;
  className?: string;
};

export function StatusBadge({
  status,
  colorMap,
  className,
}: StatusBadgeProps) {
  const statusColor = colorMap[status] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColor,
        className
      )}
    >
      {status}
    </span>
  );
}
