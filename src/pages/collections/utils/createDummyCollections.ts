
import { supabase } from "@/integrations/supabase/client";

/**
 * Fungsi untuk membuat dummy koleksi data untuk testing
 */
export const createDummyCollections = async () => {
  try {
    // Dapatkan customer IDs
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .limit(5);
    
    if (!customers || customers.length === 0) {
      throw new Error("Tidak ada customer ditemukan. Silakan buat customer terlebih dahulu.");
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    // Buat collection dummy dengan berbagai status
    const dummyCollections = [
      {
        customer_id: customers[0].id,
        customer_name: customers[0].name,
        amount: 1500000,
        due_date: tomorrow.toISOString(),
        status: 'pending',
        notes: 'Invoice #INV-2023-001',
        bank_account: 'BCA',
        invoice_number: 'INV-2023-001',
        invoice_date: today.toISOString(),
        payment_term: 'NET30'
      },
      {
        customer_id: customers[1].id,
        customer_name: customers[1].name,
        amount: 2750000,
        due_date: nextWeek.toISOString(),
        status: 'pending',
        notes: 'Invoice #INV-2023-002',
        bank_account: 'Mandiri',
        invoice_number: 'INV-2023-002',
        invoice_date: today.toISOString(),
        payment_term: 'NET15'
      },
      {
        customer_id: customers[2].id,
        customer_name: customers[2].name,
        amount: 3200000,
        due_date: lastWeek.toISOString(),
        status: 'overdue',
        notes: 'Invoice #INV-2023-003 - Overdue',
        bank_account: 'BNI',
        invoice_number: 'INV-2023-003',
        invoice_date: new Date(lastWeek.getTime() - 86400000 * 14).toISOString(),
        payment_term: 'NET7'
      }
    ];
    
    // Insert ke database
    const { error } = await supabase
      .from('collections')
      .insert(dummyCollections);
      
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error("Error creating dummy collections:", error);
    throw error;
  }
};
