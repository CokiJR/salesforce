import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { Collection, CollectionFilters } from "@/types/collection";
import { toast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';

// Helper function to transform raw Supabase data to Collection objects
const mapToCollection = (rawData: any): Collection => {
  return {
    id: rawData.id,
    customer_id: rawData.customer_id,
    customer: rawData.customer as Customer,
    customer_name: rawData.customer_name || rawData.customer?.name,
    amount: rawData.amount,
    due_date: rawData.due_date,
    payment_date: rawData.payment_date || undefined,
    status: (rawData.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
    notes: rawData.notes,
    created_at: rawData.created_at || new Date().toISOString(),
    updated_at: rawData.updated_at || new Date().toISOString(),
    bank_account: rawData.bank_account,
    transaction_id: rawData.transaction_id,
    transaction: rawData.transaction,
    sync_status: rawData.sync_status,
    order_id: rawData.order_id,
    invoice_number: rawData.invoice_number,
    invoice_date: rawData.invoice_date,
    payment_term: rawData.payment_term
  };
};

export const CollectionService = {
  async fetchCollections(): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match our Collection interface
      return (data || []).map(mapToCollection);
      
    } catch (error: any) {
      console.error("Error fetching collections:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load collections: ${error.message}`,
      });
      return [];
    }
  },

  async fetchOverdueCollections(): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('status', 'overdue')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(mapToCollection);
      
    } catch (error: any) {
      console.error("Error fetching overdue collections:", error.message);
      return [];
    }
  },

  async importCollections(collections: Omit<Collection, 'id' | 'created_at' | 'updated_at'>[]): Promise<boolean> {
    try {
      // Make sure all required fields are present in each collection
      const validatedCollections = collections.map(collection => ({
        customer_id: collection.customer_id,
        customer_name: collection.customer_name,
        amount: collection.amount,
        due_date: collection.due_date,
        status: collection.status,
        payment_date: collection.payment_date,
        notes: collection.notes,
        bank_account: collection.bank_account,
        transaction_id: collection.transaction_id,
        order_id: collection.order_id,
        sync_status: collection.sync_status || 'pending',
        invoice_number: collection.invoice_number,
        invoice_date: collection.invoice_date,
        payment_term: collection.payment_term
      }));
      
      const { error } = await supabase
        .from('collections')
        .insert(validatedCollections);
      
      if (error) throw error;
      
      toast({
        title: "Import Successful",
        description: `${collections.length} collections have been imported.`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error importing collections:", error.message);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: `Error: ${error.message}`,
      });
      return false;
    }
  },

  exportToExcel(collections: Collection[]) {
    const worksheet = XLSX.utils.json_to_sheet(collections.map(c => ({
      invoice_number: c.invoice_number || '',
      invoice_date: c.invoice_date || '',
      customer_id: c.customer_id,
      customer_name: c.customer_name || c.customer?.name || 'Unknown',
      bank_account: c.bank_account || '',
      invoice_total: c.amount,
      payment_term: c.payment_term || '',
      due_date: c.due_date ? new Date(c.due_date).toLocaleDateString() : '',
      status: c.status,
      payment_date: c.payment_date ? new Date(c.payment_date).toLocaleDateString() : '',
      notes: c.notes || '',
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'Collections_Export.xlsx');
  },

  async importFromExcel(file: File) {
    return new Promise<number>(async (resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
          try {
            if (!e.target?.result) {
              throw new Error("Failed to read file");
            }
            
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log("Imported data:", jsonData);
            
            // Map Excel data to collection format
            const collections = jsonData.map((row: any) => {
              const dueDate = row["due_date"] ? new Date(row["due_date"]) : new Date();
              const today = new Date();
              
              // Determine status based on due date
              const status = dueDate < today ? 'overdue' : 'pending';
              
              return {
                customer_id: row["Customers.id"] || row["customer_id"],
                customer_name: row["Customers.name"] || row["customer_name"],
                amount: Number(row["invoice.total"]) || Number(row["amount"]),
                due_date: row["due_date"] ? new Date(row["due_date"]).toISOString() : new Date().toISOString(),
                status: row["status"] || status,
                payment_date: row["payment_date"] ? new Date(row["payment_date"]).toISOString() : undefined,
                notes: row["notes"] || undefined,
                bank_account: row["Bank.Account"] || row["bank_account"] || undefined,
                transaction_id: row["transaction_id"] || undefined,
                order_id: row["order_id"] || undefined,
                sync_status: row["sync_status"] || 'pending',
                invoice_number: row["Invoice.number"] || row["invoice_number"],
                invoice_date: row["Invoice.date"] ? new Date(row["Invoice.date"]).toISOString() : undefined,
                payment_term: row["payment_term"]
              };
            });
            
            // Import collections
            const result = await CollectionService.importCollections(collections);
            if (result) {
              resolve(collections.length);
            } else {
              reject(new Error("Failed to import collections"));
            }
          } catch (error: any) {
            console.error("Import error:", error);
            reject(error);
          }
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(error);
      }
    });
  },

  async fetchFilteredCollections(filters: CollectionFilters): Promise<Collection[]> {
    try {
      let query = supabase
        .from('collections')
        .select(`
          *,
          customer:customers(*)
        `);
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      
      if (filters.dateRange) {
        const fromDate = filters.dateRange.from.toISOString();
        const toDate = filters.dateRange.to.toISOString();
        query = query.gte('due_date', fromDate).lte('due_date', toDate);
      }
      
      // Sort results
      query = query.order('due_date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(mapToCollection);
      
    } catch (error: any) {
      console.error("Error fetching filtered collections:", error.message);
      return [];
    }
  },

  async fetchCollectionById(id: string): Promise<Collection | null> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return mapToCollection(data);
      
    } catch (error: any) {
      console.error("Error fetching collection:", error.message);
      return null;
    }
  },

  async updateCollection(id: string, collection: Partial<Collection>): Promise<Collection | null> {
    try {
      // Make sure we don't try to update id, created_at or customer
      const { id: _, created_at: __, customer: ___, customer_id: ____, ...updateData } = collection;
      
      const { data, error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          customer:customers(*)
        `)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return mapToCollection(data);
      
    } catch (error: any) {
      console.error("Error updating collection:", error.message);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Error: ${error.message}`,
      });
      return null;
    }
  },

  async createCollection(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>): Promise<Collection | null> {
    try {
      // Ensure all required fields are present
      const newCollection = {
        customer_id: collection.customer_id,
        amount: collection.amount,
        due_date: collection.due_date,
        status: collection.status || 'pending',
        payment_date: collection.payment_date,
        notes: collection.notes,
        bank_account: collection.bank_account,
        transaction_id: collection.transaction_id,
        order_id: collection.order_id,
        sync_status: collection.sync_status || 'pending'
      };
      
      const { data, error } = await supabase
        .from('collections')
        .insert(newCollection)
        .select(`
          *,
          customer:customers(*)
        `)
        .single();
      
      if (error) throw error;
      
      return mapToCollection(data);
      
    } catch (error: any) {
      console.error("Error creating collection:", error.message);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: `Error: ${error.message}`,
      });
      return null;
    }
  },

  async deleteCollection(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error("Error deleting collection:", error.message);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: `Error: ${error.message}`,
      });
      return false;
    }
  },

  async fetchCustomerCollections(customerId: string): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('customer_id', customerId)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(mapToCollection);
      
    } catch (error: any) {
      console.error("Error fetching customer collections:", error.message);
      return [];
    }
  },

  async bulkUpdateStatus(ids: string[], status: 'pending' | 'overdue' | 'paid' | 'canceled'): Promise<boolean> {
    try {
      const updateData: any = { status };
      
      // If marking as paid, also set payment date
      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('collections')
        .update(updateData)
        .in('id', ids);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error("Error updating collection status:", error.message);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Error: ${error.message}`,
      });
      return false;
    }
  }
};
