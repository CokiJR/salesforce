
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          customer:customers(name),
          order:orders(id)
        `)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Transaction interface
      const formattedData: Transaction[] = data?.map(item => ({
        ...item,
        customer_name: item.customer?.name || "Unknown Customer",
        order_id: item.order?.id || null,
        // Ensure these fields are included to match the Transaction interface
        id: item.id,
        customer_id: item.customer_id,
        amount: item.amount,
        transaction_id: item.transaction_id,
        status: item.status,
        sync_status: item.sync_status,
        payment_method: item.payment_method as "cash" | "credit_card" | "bank_transfer",
        transaction_date: item.transaction_date,
        created_at: item.created_at
      })) || [];
      
      setTransactions(formattedData);
    } catch (error: any) {
      console.error("Error fetching transactions:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load transactions: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return { transactions, loading, fetchTransactions };
};
