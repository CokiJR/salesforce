
import React from "react";
import { FormField } from "./FormField";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { FormLabel } from "@/components/ui/form";

type Option = {
  value: string;
  label: string;
};

type RadioGroupFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  label?: string;
  description?: string;
  control: Control<TFieldValues>;
  options: Option[];
  orientation?: "horizontal" | "vertical";
  className?: string;
};

export function RadioGroupField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  control,
  options,
  orientation = "horizontal",
  className,
}: RadioGroupFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      render={({ field }) => (
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          value={field.value}
          className={`${
            orientation === "horizontal" ? "flex space-x-4" : "space-y-2"
          } ${className || ""}`}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
              <FormLabel 
                htmlFor={`${name}-${option.value}`} 
                className="font-normal cursor-pointer"
              >
                {option.label}
              </FormLabel>
            </div>
          ))}
        </RadioGroup>
      )}
    />
  );
}
