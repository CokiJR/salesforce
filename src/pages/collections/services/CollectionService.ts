import { supabase } from '@/integrations/supabase/client';
import { Collection, CollectionFilters, CollectionImportFormat } from '@/types/collection';
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

    return (data || []) as unknown as Collection[];
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
          const collectionsToCreate: any[] = [];
          
          for (const row of jsonData as Record<string, any>[]) {
            // Transform to collection object with required customer_id field
            const collection = {
              invoice_number: row.invoice_number || row.Invoice_Number || row['Invoice Number'] || '',
              customer_name: row.customer_name || row.Customer_Name || row['Customer Name'] || 'Unknown',
              customer_id: row.customer_id || '00000000-0000-0000-0000-000000000000', // Default customer ID if not provided
              amount: Number(row.amount || row.Amount || 0),
              due_date: row.due_date || row.Due_Date || row['Due Date'] 
                ? new Date(row.due_date || row.Due_Date || row['Due Date']).toISOString() 
                : new Date().toISOString(),
              status: (row.status || row.Status || 'Unpaid') === 'Paid' ? 'Paid' : 'Unpaid',
              notes: row.notes || row.Notes || '',
              bank_account: row.bank_account || row.Bank_Account || row['Bank Account'] || null,
              invoice_date: row.invoice_date || row.Invoice_Date || row['Invoice Date']
                ? new Date(row.invoice_date || row.Invoice_Date || row['Invoice Date']).toISOString()
                : new Date().toISOString(),
            };
            
            collectionsToCreate.push(collection);
          }
          
          // Batch insert collections
          if (collectionsToCreate.length > 0) {
            const { data: insertedData, error } = await supabase
              .from('collections')
              .insert(collectionsToCreate)
              .select();
            
            if (error) {
              console.error('Error importing collections:', error);
              throw new Error(error.message);
            }
            
            resolve(insertedData as unknown as Collection[]);
          } else {
            throw new Error('No valid collections found in the file');
          }
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

    return (data || []) as unknown as Collection[];
  }

  static async createCollection(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>): Promise<Collection> {
    // Ensure customer_id exists
    const collectionWithDefaults = {
      ...collection,
      customer_id: collection.customer_id || '00000000-0000-0000-0000-000000000000'
    };

    const { data, error } = await supabase
      .from('collections')
      .insert(collectionWithDefaults)
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      throw new Error(error.message);
    }

    return data as unknown as Collection;
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

    return data as unknown as Collection;
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
      status: 'Paid',
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

    // Cast the data to Customer[] type to ensure compatibility
    return (data || []) as unknown as Customer[];
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
    
    return (data || []) as unknown as Collection[];
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
    
    return (data || []) as unknown as Collection[];
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
    
    return (data || []) as unknown as Collection[];
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
        
        // Update collection with notification status
        await this.updateCollection(collection.id, {
          sync_status: 'notification_sent'
        });
        
        return true;
      } else if (notificationType === 'sms' && collection.customer.phone) {
        console.log(`[NOTIFICATION] Sending SMS to ${collection.customer.phone} for overdue payment of $${amount} due on ${dueDate}`);
        
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
    
    // We're removing the code that tries to use a non-existent table
    // (This table would need to be created if this feature is needed)
    
    // Update the collection with visit status
    return this.updateCollection(collectionId, {
      sync_status: 'visit_scheduled'
    });
  }
  
  /**
   * Export collections to Excel file with proper format
   * @param collections Collections to export
   * @returns Blob of Excel file
   */
  static exportToExcel(collections: Collection[]): Blob {
    // Prepare data for export with standardized column names
    const exportData = collections.map(collection => ({
      'Invoice Number': collection.invoice_number || '',
      'Customer Name': collection.customer?.name || collection.customer_name || '',
      'Amount': collection.amount,
      'Due Date': collection.due_date,
      'Invoice Date': collection.invoice_date || '',
      'Payment Date': collection.payment_date || '',
      'Status': collection.status,
      'Notes': collection.notes || '',
      'Bank Account': collection.bank_account || ''
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
  
  /**
   * Generate template Excel for import
   * @returns Blob of template Excel file
   */
  static generateImportTemplate(): Blob {
    // Create a template with column headers
    const templateData = [
      {
        'Invoice Number': '',
        'Customer Name': '',
        'Customer ID': '00000000-0000-0000-0000-000000000000', // Added a default customer ID field
        'Amount': '',
        'Due Date': 'YYYY-MM-DD',
        'Invoice Date': 'YYYY-MM-DD',
        'Status': 'Unpaid',
        'Notes': '',
        'Bank Account': ''
      }
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Convert to Blob
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
