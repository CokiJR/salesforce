
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type FormActionsProps = {
  isSubmitting?: boolean;
  submitText?: string;
  submittingText?: string;
  cancelText?: string;
  onCancel?: () => void;
  submitIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function FormActions({
  isSubmitting = false,
  submitText = "Submit",
  submittingText = "Submitting...",
  cancelText = "Cancel",
  onCancel,
  submitIcon,
  className = "flex justify-end gap-4 pt-4",
  disabled = false,
}: FormActionsProps) {
  return (
    <div className={className}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting || disabled}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submittingText}
          </>
        ) : (
          <>
            {submitIcon && <span className="mr-2">{submitIcon}</span>}
            {submitText}
          </>
        )}
      </Button>
    </div>
  );
}
