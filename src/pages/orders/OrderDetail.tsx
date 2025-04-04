
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Order, Customer, OrderItem, Product } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { OrderDetailView } from "./components/OrderDetailView";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch order with customer details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            customer:customers(*)
          `)
          .eq("id", id)
          .single();
        
        if (orderError) throw orderError;
        
        // Fetch order items with product details
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            *,
            product:products(*)
          `)
          .eq("order_id", id);
        
        if (itemsError) throw itemsError;
        
        // Map and prepare the order data
        const customer = orderData.customer as Customer;
        const items = itemsData.map((item: any) => ({
          ...item,
          product: item.product as Product
        })) as OrderItem[];
        
        // Create the complete order object
        const completeOrder: Order = {
          ...orderData,
          status: orderData.status as "draft" | "pending" | "confirmed" | "delivered" | "canceled",
          payment_status: orderData.payment_status as "unpaid" | "partial" | "paid",
          customer: {
            ...customer,
            cycle: customer.cycle || "YYYY",
            status: customer.status as "active" | "inactive",
            location: customer.location ? {
              lat: Number((customer.location as any).lat || 0),
              lng: Number((customer.location as any).lng || 0)
            } : undefined
          },
          items,
          notes: orderData.notes || ""
        };
        
        setOrder(completeOrder);
      } catch (error: any) {
        console.error("Error fetching order:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load order: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <div className="animate-fade-in">
      <OrderDetailView
        order={order}
        isLoading={loading}
      />
    </div>
  );
};

export default OrderDetail;
