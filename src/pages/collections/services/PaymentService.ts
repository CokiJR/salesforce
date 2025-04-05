
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types/collection';
import { Customer } from '@/types';

export class PaymentService {
  static async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        collection:collections(*),
        customer:customers(*)
      `)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw new Error(error.message);
    }

    return (data || []) as unknown as Payment[];
  }

  static async getPaymentsByCollectionId(collectionId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        collection:collections(*),
        customer:customers(*)
      `)
      .eq('collection_id', collectionId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching collection payments:', error);
      throw new Error(error.message);
    }

    return (data || []) as unknown as Payment[];
  }

  static async createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(error.message);
    }

    return data as unknown as Payment;
  }

  static async updatePaymentStatus(id: string, status: 'Pending' | 'Completed' | 'Failed'): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      throw new Error(error.message);
    }

    return data as unknown as Payment;
  }

  static async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      throw new Error(error.message);
    }
  }

  static async getUnpaidCollections(): Promise<any[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('status', 'Unpaid')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching unpaid collections:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
}
