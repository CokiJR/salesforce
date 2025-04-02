import { supabase } from '@/integrations/supabase/client';
import { Collection, CollectionFilters } from '@/types/collection';
import { Customer } from '@/types';
import * as XLSX from 'xlsx';

export class CollectionService {
  static async getCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        customer:customers(*)
      `)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      throw new Error(error.message);
    }

    // Type cast the data to match our Collection interface
    return (data || []).map(item => ({
      ...item,
      status: (item.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      customer: item.customer ? {
        ...item.customer,
        status: (item.customer.status || 'active') as 'active' | 'inactive',
        location: item.customer.location ? {
          lat: Number((item.customer.location as any).lat || 0),
          lng: Number((item.customer.location as any).lng || 0)
        } : undefined
      } : undefined
    }));
  }
  
  /**
   * Import collections from Excel file
   * @param file Excel file to import
   * @returns Array of created collections
   */
  static async importFromExcel(file: File): Promise<Collection[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Assume first sheet contains the data
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Validate and transform data
          const collectionsToCreate: Omit<Collection, 'id' | 'created_at' | 'updated_at'>[] = [];
          
          for (const row of jsonData as any[]) {
            // Validate required fields
            if (!row.customer_id || !row.amount || !row.due_date) {
              throw new Error('Missing required fields in Excel data');
            }
            
            // Transform to collection object
            const collection = {
              customer_id: String(row.customer_id),
              amount: Number(row.amount),
              due_date: new Date(row.due_date).toISOString(),
              status: (row.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
              notes: row.notes || '',
              bank_account: row.bank_account || null
            };
            
            collectionsToCreate.push(collection as any);
          }
          
          // Batch insert collections
          const { data: insertedData, error } = await supabase
            .from('collections')
            .insert(collectionsToCreate)
            .select();
          
          if (error) {
            console.error('Error importing collections:', error);
            throw new Error(error.message);
          }
          
          // Ensure returned data matches Collection type
          const typedCollections = (insertedData || []).map(item => ({
            ...item,
            status: (item.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString()
          }));
          
          resolve(typedCollections as Collection[]);
        } catch (error: any) {
          console.error('Error processing Excel file:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  static async getCollectionsByCustomerId(customerId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('customer_id', customerId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching customer collections:', error);
      throw new Error(error.message);
    }

    // Type cast the data to match our Collection interface
    return (data || []).map(item => ({
      ...item,
      status: (item.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      customer: item.customer ? {
        ...item.customer,
        status: (item.customer.status || 'active') as 'active' | 'inactive',
        location: item.customer.location ? {
          lat: Number((item.customer.location as any).lat || 0),
          lng: Number((item.customer.location as any).lng || 0)
        } : undefined
      } : undefined
    }));
  }

  static async createCollection(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert(collection)
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      throw new Error(error.message);
    }

    return {
      ...data,
      status: (data.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    } as Collection;
  }

  static async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      throw new Error(error.message);
    }

    return {
      ...data,
      status: (data.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    } as Collection;
  }

  static async deleteCollection(id: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting collection:', error);
      throw new Error(error.message);
    }
  }

  static async markAsPaid(id: string, transactionId?: string): Promise<Collection> {
    const updates: Partial<Collection> = {
      status: 'paid',
      payment_date: new Date().toISOString(),
    };

    if (transactionId) {
      updates.transaction_id = transactionId;
    }

    return this.updateCollection(id, updates);
  }

  static async getCustomersWithDuePayments(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .not('due_date', 'is', null);

    if (error) {
      console.error('Error fetching customers with due payments:', error);
      throw new Error(error.message);
    }

    return (data || []).map(customer => ({
      ...customer,
      status: (customer.status || 'active') as 'active' | 'inactive',
      location: customer.location ? {
        lat: Number((customer.location as any).lat || 0),
        lng: Number((customer.location as any).lng || 0)
      } : undefined
    }));
  }
  
  /**
   * Get collections with filters
   * @param filters Filters to apply
   * @returns Filtered collections
   */
  static async getFilteredCollections(filters: CollectionFilters): Promise<Collection[]> {
    let query = supabase
      .from('collections')
      .select(`
        *,
        customer:customers(*)
      `);
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      if (filters.dateRange.from) {
        query = query.gte('due_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('due_date', filters.dateRange.to.toISOString());
      }
    }
    
    // Apply customer filter
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    
    // Order by due date
    query = query.order('due_date', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching filtered collections:', error);
      throw new Error(error.message);
    }
    
    // Type cast the data to match our Collection interface
    return (data || []).map(item => ({
      ...item,
      status: (item.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      customer: item.customer ? {
        ...item.customer,
        status: (item.customer.status || 'active') as 'active' | 'inactive',
        location: item.customer.location ? {
          lat: Number((item.customer.location as any).lat || 0),
          lng: Number((item.customer.location as any).lng || 0)
        } : undefined
      } : undefined
    }));
  }
  
  /**
   * Calculate due date based on invoice date and payment terms
   * @param invoiceDate Invoice date
   * @param paymentTerms Payment terms in days
   * @returns Calculated due date
   */
  static calculateDueDate(invoiceDate: Date, paymentTerms: number): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate;
  }
  
  /**
   * Get overdue collections
   * @returns Array of overdue collections
   */
  static async getOverdueCollections(): Promise<Collection[]> {
    const today = new Date();
    
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('status', 'pending')
      .lt('due_date', today.toISOString())
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching overdue collections:', error);
      throw new Error(error.message);
    }
    
    // Type cast the data to match our Collection interface
    return (data || []).map(item => ({
      ...item,
      status: (item.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      customer: item.customer ? {
        ...item.customer,
        status: (item.customer.status || 'active') as 'active' | 'inactive',
        location: item.customer.location ? {
          lat: Number((item.customer.location as any).lat || 0),
          lng: Number((item.customer.location as any).lng || 0)
        } : undefined
      } : undefined
    }));
  }
  
  /**
   * Get upcoming collections due within specified days
   * @param days Number of days to look ahead
   * @returns Array of upcoming collections
   */
  static async getUpcomingCollections(days: number = 7): Promise<Collection[]> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString())
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching upcoming collections:', error);
      throw new Error(error.message);
    }
    
    // Type cast the data to match our Collection interface
    return (data || []).map(item => ({
      ...item,
      status: (item.status || 'pending') as 'pending' | 'overdue' | 'paid' | 'canceled',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      customer: item.customer ? {
        ...item.customer,
        status: (item.customer.status || 'active') as 'active' | 'inactive',
        location: item.customer.location ? {
          lat: Number((item.customer.location as any).lat || 0),
          lng: Number((item.customer.location as any).lng || 0)
        } : undefined
      } : undefined
    }));
  }
  
  /**
   * Send notification for overdue collection
   * @param collection Collection to send notification for
   * @param notificationType Type of notification (email, sms)
   * @returns Success status
   */
  static async sendOverdueNotification(collection: Collection, notificationType: 'email' | 'sms' = 'email'): Promise<boolean> {
    if (!collection.customer) {
      console.error('Customer information missing for notification');
      return false;
    }
    
    try {
      // In a real implementation, this would connect to an email or SMS service
      // For now, we'll just log the notification
      const dueDate = new Date(collection.due_date).toLocaleDateString();
      const amount = collection.amount.toFixed(2);
      
      if (notificationType === 'email' && collection.customer.email) {
        console.log(`[NOTIFICATION] Sending email to ${collection.customer.email} for overdue payment of $${amount} due on ${dueDate}`);
        
        // Here you would integrate with an email service like SendGrid, Mailchimp, etc.
        // Example: await emailService.send({ to: collection.customer.email, subject: 'Overdue Payment', ... })
        
        // Update collection with notification status
        await this.updateCollection(collection.id, {
          sync_status: 'notification_sent'
        });
        
        return true;
      } else if (notificationType === 'sms' && collection.customer.phone) {
        console.log(`[NOTIFICATION] Sending SMS to ${collection.customer.phone} for overdue payment of $${amount} due on ${dueDate}`);
        
        // Here you would integrate with an SMS service like Twilio, etc.
        // Example: await smsService.send({ to: collection.customer.phone, message: `Your payment of $${amount} was due on ${dueDate}...` })
        
        // Update collection with notification status
        await this.updateCollection(collection.id, {
          sync_status: 'notification_sent'
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
  
  /**
   * Schedule a collection visit
   * @param collectionId Collection ID to schedule visit for
   * @param visitDate Date of the scheduled visit
   * @param assignedTo User ID of person assigned to the visit
   * @returns Updated collection
   */
  static async scheduleCollectionVisit(collectionId: string, visitDate: Date, assignedTo: string): Promise<Collection> {
    // First, get the collection to ensure it exists
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching collection for scheduling:', fetchError);
      throw new Error(fetchError.message);
    }
    
    // Update the collection with visit status instead of trying to create a visit in a non-existent table
    return this.updateCollection(collectionId, {
      sync_status: 'visit_scheduled'
    });
  }
  
  /**
   * Export collections to Excel file
   * @param collections Collections to export
   * @returns Blob of Excel file
   */
  static exportToExcel(collections: Collection[]): Blob {
    // Prepare data for export
    const exportData = collections.map(collection => ({
      customer_id: collection.customer_id,
      customer_name: collection.customer?.name || '',
      amount: collection.amount,
      due_date: collection.due_date,
      payment_date: collection.payment_date || '',
      status: collection.status,
      notes: collection.notes || '',
      bank_account: collection.bank_account || ''
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Convert to Blob
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
