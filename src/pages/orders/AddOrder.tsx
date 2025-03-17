import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { useAuthentication } from "@/hooks/useAuthentication";
import { OrderSummaryPanel } from "./components/OrderSummaryPanel";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderForm, OrderFormValues } from "./components/OrderForm";
import { useOrderFormData } from "./hooks/useOrderFormData";
import { OrderItemWithDetails, calculateOrderTotal } from "./utils/orderFormUtils";

export default function AddOrder() {
  const { user } = useAuthentication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers, products, loadingItems } = useOrderFormData();
  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const navigate = useNavigate();

  // Calculate total amount
  const totalAmount = calculateOrderTotal(orderItems);

  // Handle adding an item to the order
  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Check if product is already in the items list
    if (orderItems.some(item => item.product_id === selectedProduct)) {
      toast({
        variant: "destructive",
        title: "Duplicate product",
        description: "This product is already added to the order. Please modify the quantity instead.",
      });
      return;
    }
    
    const newItem = {
      product_id: product.id,
      product: product,
      quantity: quantity,
      price: product.price,
      total: product.price * quantity
    };
    
    setOrderItems([...orderItems, newItem]);
    setSelectedProduct("");
    setQuantity(1);
  };

  // Handle removing an item from the order
  const handleRemoveItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  // Handle form submission
  const onSubmit = async (data: OrderFormValues) => {
    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No items added",
        description: "Please add at least one product to the order.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create order object with default status and payment_status
      const orderData = {
        customer_id: data.customer_id,
        salesperson_id: user?.id,
        delivery_date: format(data.delivery_date, "yyyy-MM-dd"),
        payment_status: "unpaid", // Default payment status
        status: "draft", // Default status
        total_amount: totalAmount,
        notes: data.notes || "",
        sync_status: "pending",
      };
      
      // Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select("*")
        .single();
      
      if (orderError) throw orderError;
      
      // Insert order items
      const orderItemsData = orderItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);
      
      if (itemsError) throw itemsError;
      
      toast({
        title: "Order created",
        description: `Order has been created successfully.`,
      });
      
      navigate("/dashboard/orders");
    } catch (error: any) {
      console.error("Error creating order:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create order: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/orders")}
            className="rounded-full"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create Order</h1>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <OrderForm 
            customers={customers}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => navigate("/dashboard/orders")}
            hasOrderItems={orderItems.length > 0}
            orderItemsComponent={
              <OrderItemsTable
                orderItems={orderItems}
                products={products}
                selectedProduct={selectedProduct}
                quantity={quantity}
                handleAddItem={handleAddItem}
                handleRemoveItem={handleRemoveItem}
                setSelectedProduct={setSelectedProduct}
                setQuantity={setQuantity}
                totalAmount={totalAmount}
              />
            }
          />
        </div>
        
        <div className="md:col-span-1">
          <OrderSummaryPanel 
            orderItems={orderItems} 
            totalAmount={totalAmount} 
          />
        </div>
      </div>
    </div>
  );
}
