
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { Collection, CollectionFilters } from "@/types/collection";
import { toast } from "@/components/ui/use-toast";

// Helper function to transform raw Supabase data to Collection objects
const mapToCollection = (rawData: any): Collection => {
  return {
    id: rawData.id,
    customer_id: rawData.customer_id,
    customer: rawData.customer as Customer,
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
    order_id: rawData.order_id
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
        amount: collection.amount,
        due_date: collection.due_date,
        status: collection.status,
        payment_date: collection.payment_date,
        notes: collection.notes,
        bank_account: collection.bank_account,
        transaction_id: collection.transaction_id,
        order_id: collection.order_id,
        sync_status: collection.sync_status || 'pending'
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
      const { error } = await supabase
        .from('collections')
        .update({ status })
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
