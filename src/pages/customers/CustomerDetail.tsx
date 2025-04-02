
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Customer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { CustomerDetailView } from "./components/CustomerDetailView";
import { isUuid } from "./utils/customerIdUtils";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        let query = supabase.from("customers").select("*");
        
        // Handle both UUID and formatted customer IDs
        if (isUuid(id)) {
          query = query.eq("id", id);
        } else {
          query = query.eq("id", id);
        }
        
        const { data, error } = await query.single();
        
        if (error) throw error;
        
        // Convert the raw data to properly typed Customer object
        const typedCustomer: Customer = {
          ...data,
          status: data.status as "active" | "inactive",
          cycle: data.cycle || "YYYY",
          location: data.location ? {
            lat: Number((data.location as any).lat || 0),
            lng: Number((data.location as any).lng || 0)
          } : undefined,
          payment_term: data.payment_term || undefined,
          payment_term_description: data.payment_term_description || undefined,
          bank_account: data.bank_account || undefined
        };
        
        setCustomer(typedCustomer);
      } catch (error: any) {
        console.error("Error fetching customer:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load customer: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  return (
    <div className="animate-fade-in">
      <CustomerDetailView 
        customer={customer}
        isLoading={loading}
      />
    </div>
  );
};

export default CustomerDetail;
