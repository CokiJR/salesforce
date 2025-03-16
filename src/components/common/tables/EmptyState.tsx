
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  hasFilters?: boolean;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  hasFilters = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>
      {onAction && !hasFilters && (
        <Button onClick={onAction} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel || "Add New"}
        </Button>
      )}
    </div>
  );
}
