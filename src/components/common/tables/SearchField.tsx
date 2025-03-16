
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchFieldProps) {
  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
