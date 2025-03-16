
import React from "react";
import { Product } from "@/types";
import { DataTable, Column } from "@/components/common/tables/DataTable";
import { StatusBadge } from "@/components/common/tables/StatusBadge";
import { formatCurrency } from "@/utils/formatters";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  onProductClick: (productId: string) => void;
}

export function ProductsTable({ 
  products, 
  loading, 
  onProductClick 
}: ProductsTableProps) {
  const columns: Column<Product>[] = [
    {
      header: "SKU",
      accessorKey: "sku",
      cell: (product) => (
        <span className="font-medium">{product.sku}</span>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Category",
      accessorKey: "category",
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: (product) => formatCurrency(product.price),
    },
    {
      header: "Stock",
      accessorKey: (product) => `${product.stock} ${product.unit}`,
      cell: (product) => (
        <StatusBadge
          status={`${product.stock} ${product.unit}`}
          colorMap={{
            [`${product.stock} ${product.unit}`]: 
              product.stock > 10 
                ? "bg-green-100 text-green-800" 
                : product.stock > 0 
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800",
          }}
        />
      ),
    },
  ];

  return (
    <DataTable<Product>
      data={products}
      columns={columns}
      loading={loading}
      onRowClick={(product) => onProductClick(product.id)}
    />
  );
}
