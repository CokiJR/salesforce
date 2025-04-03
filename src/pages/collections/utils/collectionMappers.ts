
import { Customer } from "@/types";
import { Collection } from "@/types/collection";

/**
 * Transforms raw Supabase data to Collection objects
 */
export const mapToCollection = (rawData: any): Collection => {
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

/**
 * Maps collection data for Excel export
 */
export const mapCollectionForExport = (collection: Collection) => ({
  invoice_number: collection.invoice_number || '',
  invoice_date: collection.invoice_date || '',
  customer_id: collection.customer_id,
  customer_name: collection.customer_name || collection.customer?.name || 'Unknown',
  bank_account: collection.bank_account || '',
  invoice_total: collection.amount,
  payment_term: collection.payment_term || '',
  due_date: collection.due_date ? new Date(collection.due_date).toLocaleDateString() : '',
  status: collection.status,
  payment_date: collection.payment_date ? new Date(collection.payment_date).toLocaleDateString() : '',
  notes: collection.notes || '',
});
