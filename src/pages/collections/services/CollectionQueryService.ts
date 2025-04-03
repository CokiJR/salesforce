
import { supabase } from "@/integrations/supabase/client";
import { Collection, CollectionFilters } from "@/types/collection";
import { toast } from "@/hooks/use-toast";
import { mapToCollection } from "../utils/collectionMappers";

export const CollectionQueryService = {
  /**
   * Fetches all collections
   */
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

  /**
   * Fetches only overdue collections
   */
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

  /**
   * Fetches collections for a specific customer
   */
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

  /**
   * Fetches collections based on filters
   */
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
  }
};
