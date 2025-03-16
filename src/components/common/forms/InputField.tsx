
import React from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { LucideIcon } from "lucide-react";

type InputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  control: Control<TFieldValues>;
  icon?: LucideIcon;
  className?: string;
};

export function InputField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  placeholder,
  type = "text",
  control,
  icon: Icon,
  className,
}: InputFieldProps<TFieldValues, TName>) {
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
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            className={`${Icon ? "pl-10" : ""} ${className || ""}`}
          />
        </div>
      )}
    />
  );
}
