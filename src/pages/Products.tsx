
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { ProductsTable } from "./products/components/ProductsTable";
import { SearchField } from "@/components/common/tables/SearchField";
import { EmptyState } from "@/components/common/tables/EmptyState";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load products: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    navigate("/dashboard/products/add");
  };

  const handleProductDetails = (productId: string) => {
    navigate(`/dashboard/products/${productId}`);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <SearchField
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search products..."
      />

      {filteredProducts.length > 0 || loading ? (
        <ProductsTable 
          products={filteredProducts}
          loading={loading}
          onProductClick={handleProductDetails}
        />
      ) : (
        <EmptyState
          icon={Package}
          title="No products found"
          description={searchQuery ? "Try a different search term" : "Get started by adding your first product"}
          actionLabel="Add Product"
          onAction={handleAddProduct}
          hasFilters={!!searchQuery}
        />
      )}
    </div>
  );
};

export default Products;
