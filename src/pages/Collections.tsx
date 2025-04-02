
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileDown, FileUp } from "lucide-react";
import { useCollections } from "./collections/hooks/useCollections";
import CollectionsList from "./collections/components/CollectionsList";
import CollectionImportExport from "./collections/components/CollectionImportExport";

const Collections = () => {
  const { 
    collections, 
    overdueCollections, 
    isLoading, 
    markAsPaid,
    selectedCollections, 
    setSelectedCollections,
    exportToExcel,
    importFromExcel
  } = useCollections();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  
  const handleMarkAsPaid = () => {
    if (selectedCollections.length === 0) {
      toast({
        title: "No collections selected",
        description: "Please select collections to mark as paid.",
        variant: "destructive"
      });
      return;
    }
    
    markAsPaid(selectedCollections.map(collection => collection.id));
    toast({
      title: "Collections Updated",
      description: `${selectedCollections.length} collection(s) marked as paid.`
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            disabled={selectedCollections.length === 0}
            onClick={handleMarkAsPaid}
          >
            Mark Selected as Paid
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Collection
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-[400px]">
              <TabsTrigger value="all">All Collections</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <CollectionsList 
                collections={collections}
                loading={isLoading}
                selectedCollections={selectedCollections}
                setSelectedCollections={setSelectedCollections}
              />
            </TabsContent>
            <TabsContent value="overdue">
              <CollectionsList 
                collections={overdueCollections}
                loading={isLoading}
                selectedCollections={selectedCollections}
                setSelectedCollections={setSelectedCollections}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <CollectionImportExport 
            collections={collections} 
            exportToExcel={exportToExcel}
            importFromExcel={importFromExcel}
          />
        </div>
      </div>
    </div>
  );
};

export default Collections;
