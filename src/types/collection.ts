
import { Customer, Transaction } from '.';

export interface Collection {
  id: string;
  customer_id: string;
  customer?: Customer;
  invoice_number: string;
  customer_name: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'Paid' | 'Unpaid';
  notes?: string;
  created_at: string;
  updated_at: string;
  bank_account?: string;
  transaction_id?: string;
  transaction?: Transaction;
  sync_status?: string;
  invoice_date?: string;
}

export interface CollectionFilters {
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  customerId?: string;
}
