
import React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { FormField } from "./FormField";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

type DatePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  control: Control<TFieldValues>;
  disablePast?: boolean;
  disableFuture?: boolean;
  className?: string;
};

export function DatePickerField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  placeholder,
  control,
  disablePast = false,
  disableFuture = false,
  className,
}: DatePickerFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      render={({ field }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full pl-3 text-left font-normal",
                !field.value && "text-muted-foreground",
                className
              )}
            >
              {field.value ? (
                format(field.value, "PPP")
              ) : (
                <span>{placeholder || "Pick a date"}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={(date) => {
                const today = new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  (disablePast && date < today) ||
                  (disableFuture && date > today)
                );
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    />
  );
}
