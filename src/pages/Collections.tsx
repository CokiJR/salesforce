
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CollectionsList } from "./collections/components/CollectionsList";
import CollectionImportExport from "./collections/components/CollectionImportExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollections } from "./collections/hooks/useCollections";
import { Collection } from "@/types/collection";
import { CollectionService } from "./collections/services/CollectionService";
import { Loader2 } from "lucide-react";

const Collections = () => {
  const { collections, loading, fetchCollections } = useCollections();
  const { toast } = useToast();
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
  };

  const exportToExcel = async (collections: Collection[]) => {
    try {
      await CollectionService.exportToExcel(collections);
      toast({
        title: "Export Successful",
        description: `${collections.length} collections exported to Excel`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "Failed to export collections to Excel",
      });
    }
  };

  const importFromExcel = async (file: File) => {
    try {
      const importedCount = await CollectionService.importFromExcel(file);
      toast({
        title: "Import Successful",
        description: `${importedCount} collections imported from Excel`,
      });
      fetchCollections();
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import collections from Excel",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Collections</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CollectionsList 
              collections={collections}
              onSelectCollection={handleSelectCollection}
            />
          )}
        </div>

        <div className="space-y-6">
          <CollectionImportExport 
            collections={collections}
            exportToExcel={exportToExcel}
            importFromExcel={importFromExcel}
          />
          
          {selectedCollection && (
            <Card>
              <CardHeader>
                <CardTitle>Collection Details</CardTitle>
                <CardDescription>
                  Detailed information about the selected collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <span>{selectedCollection.customer_name}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span>${selectedCollection.amount.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Due Date:</span>
                    <span>
                      {selectedCollection.due_date ? 
                        new Date(selectedCollection.due_date).toLocaleDateString() : 
                        'Not set'
                      }
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Payment Date:</span>
                    <span>
                      {selectedCollection.payment_date ? 
                        new Date(selectedCollection.payment_date).toLocaleDateString() : 
                        'Not paid yet'
                      }
                    </span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className="capitalize">{selectedCollection.status}</span>
                  </div>
                  {selectedCollection.notes && (
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground block">Notes:</span>
                      <p className="text-sm mt-1">{selectedCollection.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collections;
