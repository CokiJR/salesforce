
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./FormField";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { LucideIcon } from "lucide-react";

type TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  control: Control<TFieldValues>;
  icon?: LucideIcon;
  rows?: number;
  className?: string;
};

export function TextareaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  placeholder,
  control,
  icon: Icon,
  rows = 3,
  className,
}: TextareaFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      render={({ field }) => (
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          )}
          <Textarea
            {...field}
            placeholder={placeholder}
            rows={rows}
            className={`${Icon ? "pl-10" : ""} ${className || ""}`}
          />
        </div>
      )}
    />
  );
}
