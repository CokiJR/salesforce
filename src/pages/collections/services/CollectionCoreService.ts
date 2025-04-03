
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { toast } from "@/hooks/use-toast";
import { mapToCollection } from "../utils/collectionMappers";

export const CollectionCoreService = {
  /**
   * Fetches a specific collection by ID
   */
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

  /**
   * Creates a new collection
   */
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

  /**
   * Updates an existing collection
   */
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

  /**
   * Deletes a collection by ID
   */
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

  /**
   * Bulk updates collection status
   */
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
  },

  /**
   * Import multiple collections
   */
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
  }
};
