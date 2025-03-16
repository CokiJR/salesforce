
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Customer, Product } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar as CalendarIcon, Loader2, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useAuthentication } from "@/hooks/useAuthentication";

// Order form schema
const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  payment_status: z.enum(["unpaid", "partial", "paid"]),
  status: z.enum(["draft", "pending", "confirmed", "delivered", "canceled"]),
  delivery_date: z.date(),
  notes: z.string().optional(),
});

// Product item schema
const orderItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
});

type OrderFormValues = z.infer<typeof orderSchema>;
type OrderItemValues = z.infer<typeof orderItemSchema>;

export default function AddOrder() {
  const { user } = useAuthentication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<Array<OrderItemValues & { product: Product, price: number, total: number }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loadingItems, setLoadingItems] = useState(true);
  const navigate = useNavigate();

  // Initialize the form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: "",
      delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      payment_status: "unpaid",
      status: "draft",
      notes: "",
    },
  });

  // Calculate total amount
  const totalAmount = orderItems.reduce((total, item) => total + item.total, 0);

  // Fetch customers and products
  useEffect(() => {
    const fetchData = async () => {
      setLoadingItems(true);
      try {
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .eq("status", "active")
          .order("name");
        
        if (customersError) throw customersError;
        setCustomers(customersData || []);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .order("name");
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load data: ${error.message}`,
        });
      } finally {
        setLoadingItems(false);
      }
    };

    fetchData();
  }, []);

  // Handle adding an item to the order
  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
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
      
      // Create order object
      const orderData = {
        customer_id: data.customer_id,
        salesperson_id: user?.id,
        delivery_date: format(data.delivery_date, "yyyy-MM-dd"),
        payment_status: data.payment_status,
        status: data.status,
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="delivery_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Delivery Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partially Paid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes about this order" 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order Items</h3>
                
                <div className="flex gap-2">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)} / {product.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-24"
                    placeholder="Qty"
                  />
                  
                  <Button type="button" onClick={handleAddItem} variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                
                {orderItems.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right">{item.quantity} {item.product.unit}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveItem(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">
                            Total:
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(totalAmount)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No items added to this order yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the form above to add products</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/orders")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || orderItems.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Order</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="md:col-span-1">
          <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center sticky top-6">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
            <div className="w-full space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-medium">{orderItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Quantity:</span>
                <span className="font-medium">
                  {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">Order Total:</span>
                <span className="font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Review the details above before creating the order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
