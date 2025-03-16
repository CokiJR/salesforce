
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useOrdersData = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*)
        `)
        .order("order_date", { ascending: false });

      if (error) throw error;
      
      // Convert the raw data to match the Order type by fetching items
      const ordersWithItems = await Promise.all(data?.map(async (order) => {
        const { data: items } = await supabase
          .from("order_items")
          .select(`
            *,
            product:products(*)
          `)
          .eq("order_id", order.id);
        
        // Create a properly typed order object
        const typedOrder: Order = {
          ...order,
          status: order.status as "draft" | "pending" | "confirmed" | "delivered" | "canceled",
          payment_status: order.payment_status as "unpaid" | "partial" | "paid",
          // Create a fully typed customer object from the fetched data
          customer: {
            id: order.customer.id,
            name: order.customer.name,
            address: order.customer.address,
            city: order.customer.city,
            phone: order.customer.phone,
            email: order.customer.email || "",
            contact_person: order.customer.contact_person,
            status: order.customer.status as "active" | "inactive",
            created_at: order.customer.created_at,
            location: order.customer.location ? {
              lat: Number((order.customer.location as any).lat || 0),
              lng: Number((order.customer.location as any).lng || 0)
            } : undefined
          },
          // Create properly typed order items
          items: items?.map(item => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            product: item.product
          })) || []
        };
        
        return typedOrder;
      }) || []);
      
      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error("Error fetching orders:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load orders: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    fetchOrders
  };
};
