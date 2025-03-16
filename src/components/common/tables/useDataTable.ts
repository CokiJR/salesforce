
import { useState, useEffect, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

type SortState<T> = {
  column: keyof T | null;
  direction: SortDirection;
};

type DataTableOptions<T> = {
  data: T[];
  initialPageSize?: number;
  initialSortState?: SortState<T>;
  searchFields?: Array<keyof T>;
};

export function useDataTable<T>({
  data,
  initialPageSize = 10,
  initialSortState = { column: null, direction: null },
  searchFields = [],
}: DataTableOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortState, setSortState] = useState<SortState<T>>(initialSortState);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchQuery, sortState]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) return data;
    
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowercasedQuery);
      });
    });
  }, [data, searchQuery, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.column as keyof T];
      const bValue = b[sortState.column as keyof T];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortState]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  // Handle sort
  const handleSort = (column: keyof T) => {
    setSortState(current => {
      if (current.column === column) {
        // Cycle through: asc -> desc -> null
        if (current.direction === "asc") return { column, direction: "desc" };
        if (current.direction === "desc") return { column: null, direction: null };
        return { column, direction: "asc" };
      }
      
      // New column, start with ascending
      return { column, direction: "asc" };
    });
  };

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    sortState,
    setSortState,
    handleSort,
    searchQuery,
    setSearchQuery,
    filteredData,
    paginatedData,
  };
}
