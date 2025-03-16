
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: TablePaginationProps) {
  // Display at most 5 page links
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than max, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include page 1
      pageNumbers.push(1);
      
      // Calculate the start and end of the sliding window
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis if needed
      if (start > 2) {
        pageNumbers.push(-1); // use -1 as a marker for ellipsis
      }
      
      // Add pages from start to end
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pageNumbers.push(-2); // use -2 as a marker for ellipsis
      }
      
      // Always include the last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        {getPageNumbers().map((page, i) => (
          <PaginationItem key={i}>
            {page === -1 || page === -2 ? (
              <span className="px-4 py-2">...</span>
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={page === currentPage}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
