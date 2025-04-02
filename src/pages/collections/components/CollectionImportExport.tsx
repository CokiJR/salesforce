
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload } from "lucide-react";
import { Collection } from "@/types/collection";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface CollectionImportExportProps {
  collections: Collection[];
  exportToExcel: (collections: Collection[]) => void;
  importFromExcel: (file: File) => Promise<void>;
}

export const CollectionImportExport = ({
  collections,
  exportToExcel,
  importFromExcel
}: CollectionImportExportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  
  const handleExport = () => {
    exportToExcel(collections);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      await importFromExcel(file);
    } catch (err) {
      console.error("Import failed:", err);
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
        <CardDescription>
          Import collections from Excel or export current collections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleExport}
            disabled={collections.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <div className="relative">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="cursor-pointer"
              disabled={isImporting}
            />
            <Button 
              variant="outline" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              disabled={isImporting}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import from Excel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollectionImportExport;
