
import * as XLSX from 'xlsx';
import { Collection } from "@/types/collection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { mapCollectionForExport } from '../utils/collectionMappers';

export const CollectionExcelService = {
  /**
   * Exports collections to an Excel file
   */
  exportToExcel(collections: Collection[]) {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        collections.map(mapCollectionForExport)
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
      
      // Generate Excel file
      XLSX.writeFile(workbook, 'Collections_Export.xlsx');
      return true;
    } catch (error) {
      console.error("Export to Excel failed:", error);
      throw error;
    }
  },

  /**
   * Imports collections from an Excel file
   */
  async importFromExcel(file: File): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
          try {
            if (!e.target?.result) {
              throw new Error("Failed to read file");
            }
            
            const fileContent = e.target.result;
            const workbook = XLSX.read(fileContent, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log("Imported data from Excel:", jsonData);
            
            if (jsonData.length === 0) {
              throw new Error("No data found in the Excel file");
            }
            
            // Map Excel data to collection format
            const collections = jsonData.map((row: any) => {
              console.log("Processing row:", row);
              
              // Try to parse due date
              let dueDate;
              if (row["due_date"]) {
                try {
                  dueDate = new Date(row["due_date"]);
                } catch (e) {
                  console.error("Error parsing due date:", e);
                  dueDate = new Date();
                }
              } else {
                dueDate = new Date();
              }
              
              const today = new Date();
              
              // Determine status based on due date
              const status = dueDate < today ? 'overdue' : 'pending';
              
              // Find correct field names
              const customerId = row["Customers.id"] || row["customer_id"] || row["Customers id"];
              const customerName = row["Customers.name"] || row["customer_name"] || row["Customers.name"];
              const invoiceTotal = Number(row["invoice.total"] || row["invoice_total"] || row["invoice.total"] || 0);
              const bankAccount = row["Bank.Account"] || row["bank_account"] || row["Bank.Account"] || '';
              const invoiceNumber = row["Invoice.number"] || row["invoice_number"] || row["Invoice number"];
              const invoiceDate = row["Invoice.date"] || row["invoice_date"] || row["Invoice.date"];
              const paymentTerm = row["payment_term"] || row["payment term"] || '';
              
              return {
                customer_id: customerId,
                customer_name: customerName,
                amount: invoiceTotal,
                due_date: row["due_date"] ? new Date(row["due_date"]).toISOString() : new Date().toISOString(),
                status: row["status"] || status,
                payment_date: row["payment_date"] ? new Date(row["payment_date"]).toISOString() : undefined,
                notes: row["notes"] || undefined,
                bank_account: bankAccount,
                transaction_id: row["transaction_id"] || undefined,
                order_id: row["order_id"] || undefined,
                sync_status: row["sync_status"] || 'pending',
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate ? new Date(invoiceDate).toISOString() : undefined,
                payment_term: paymentTerm
              };
            });
            
            console.log("Collections to import:", collections);
            
            // Import collections
            const { error } = await supabase
              .from('collections')
              .insert(collections);
            
            if (error) {
              console.error("Supabase insert error:", error);
              throw error;
            }
            
            resolve(collections.length);
          } catch (error: any) {
            console.error("Import processing error:", error);
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };
        
        reader.readAsArrayBuffer(file);
      } catch (error: any) {
        console.error("Import setup error:", error);
        reject(error);
      }
    });
  }
};
