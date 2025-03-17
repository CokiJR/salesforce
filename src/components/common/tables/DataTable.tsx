
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export type Column<T> = {
  header: string;
  accessorKey: keyof T | ((item: T) => React.ReactNode);
  cell?: (item: T) => React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
  emptyState?: React.ReactNode;
  id?: string;
  noWrap?: boolean;
};

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  onRowClick,
  getRowClassName,
  emptyState,
  id,
  noWrap = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="rounded-md border">
      <Table id={id}>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={noWrap ? "whitespace-nowrap" : ""}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const rowClassName = getRowClassName?.(item) || "";
            
            return (
              <TableRow
                key={item.id}
                className={`${
                  onRowClick ? "cursor-pointer hover:bg-muted/60" : ""
                } ${rowClassName}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column, index) => {
                  let cellContent: React.ReactNode;
                  
                  if (column.cell) {
                    // Use the custom cell renderer if provided
                    cellContent = column.cell(item);
                  } else if (typeof column.accessorKey === "function") {
                    // Use the accessor function
                    cellContent = column.accessorKey(item);
                  } else {
                    // Get the value directly from the item
                    const value = item[column.accessorKey];
                    // Convert the value to string to ensure it's a valid ReactNode
                    cellContent = value != null ? String(value) : '';
                  }
                  
                  return (
                    <TableCell 
                      key={index}
                      className={noWrap ? "whitespace-nowrap" : ""}
                    >
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
