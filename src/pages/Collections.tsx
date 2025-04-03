
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CollectionsList } from "./collections/components/CollectionsList";
import CollectionImportExport from "./collections/components/CollectionImportExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollections } from "./collections/hooks/useCollections";
import { Collection } from "@/types/collection";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CollectionService } from "./collections/services/CollectionService";

const Collections = () => {
  const { collections, isLoading, error, refetch } = useCollections();
  const { toast } = useToast();
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
  };

  const handleProcessPayment = async (collection: Collection) => {
    try {
      // Update collection status to paid
      const { error } = await supabase
        .from('collections')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString() 
        })
        .eq('id', collection.id);
      
      if (error) throw error;
      
      toast({
        title: "Payment Processed",
        description: `Payment for ${collection.customer_name || 'customer'} has been recorded.`,
      });
      
      refetch();
    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
      });
    }
  };

  const exportToExcel = async (collections: Collection[]) => {
    try {
      CollectionService.exportToExcel(collections);
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
      refetch();
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
          {isLoading ? (
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
                    <span>{selectedCollection.customer_name || selectedCollection.customer?.name || 'Unknown'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-sm text-muted-foreground">Invoice Number:</span>
                    <span>{selectedCollection.invoice_number || 'N/A'}</span>
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
                    <span className="text-sm text-muted-foreground">Bank Account:</span>
                    <span>{selectedCollection.bank_account || 'Not specified'}</span>
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
                  
                  {selectedCollection.status !== 'paid' && (
                    <div className="pt-4">
                      <Button 
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => handleProcessPayment(selectedCollection)}
                      >
                        Process Payment
                      </Button>
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
