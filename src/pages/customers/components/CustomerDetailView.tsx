
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Customer, Order, DailyRoute, RouteStop } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Edit, Trash2, ShoppingCart, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerDetailViewProps {
  customer: Customer | null;
  isLoading: boolean;
}

export function CustomerDetailView({ customer, isLoading }: CustomerDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerVisits, setCustomerVisits] = useState<RouteStop[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const navigate = useNavigate();

  // Fetch related orders and visits when a customer is selected
  useState(() => {
    if (customer) {
      fetchRelatedData(customer.id);
    }
  });

  const fetchRelatedData = async (customerId: string) => {
    setIsLoadingRelated(true);
    try {
      // Fetch customer orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("order_date", { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Fetch customer visits
      const { data: stops, error: stopsError } = await supabase
        .from("route_stops")
        .select("*, daily_routes(*)")
        .eq("customer_id", customerId)
        .order("visit_date", { ascending: false });
      
      if (stopsError) throw stopsError;
      
      setCustomerOrders(orders || []);
      setCustomerVisits(stops || []);
    } catch (error: any) {
      console.error("Error fetching related data:", error.message);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const handleEdit = () => {
    if (customer) {
      navigate(`/dashboard/customers/edit/${customer.id}`);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      setIsDeleting(true);
      
      // Check if customer has any orders
      const { data: orders, error: ordersCheckError } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", customer.id)
        .limit(1);
      
      if (ordersCheckError) throw ordersCheckError;
      
      if (orders && orders.length > 0) {
        throw new Error("Cannot delete customer with associated orders");
      }
      
      // Check if customer has any route stops
      const { data: stops, error: stopsCheckError } = await supabase
        .from("route_stops")
        .select("id")
        .eq("customer_id", customer.id)
        .limit(1);
      
      if (stopsCheckError) throw stopsCheckError;
      
      if (stops && stops.length > 0) {
        throw new Error("Cannot delete customer with associated route stops");
      }
      
      // Delete the customer
      const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted",
      });
      
      navigate("/dashboard/customers");
    } catch (error: any) {
      console.error("Error deleting customer:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete customer: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to get cycle description
  const getCycleDescription = (cycle: string) => {
    switch(cycle) {
      case 'YYYY':
        return 'Every Week';
      case 'YTYT':
        return 'Week 1 & 3';
      case 'TYTY':
        return 'Week 2 & 4';
      default:
        return cycle;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Customer Selected</CardTitle>
          <CardDescription>
            Select a customer from the list to view their details
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/customers")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Customer Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the customer.
                  If this customer has any orders or is included in any routes, it cannot be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{customer.name}</CardTitle>
              <CardDescription>{customer.address}, {customer.city}</CardDescription>
            </div>
            <Badge className={customer.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {customer.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
              <p>{customer.contact_person}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p>{customer.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{customer.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visit Cycle</p>
              <p>{getCycleDescription(customer.cycle)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{format(new Date(customer.created_at), "MMM d, yyyy")}</p>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Orders History</TabsTrigger>
              <TabsTrigger value="visits">Visit History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-4">
              {isLoadingRelated ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : customerOrders.length > 0 ? (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <div className="flex items-start p-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Order #{order.id.substring(0, 8)}</h4>
                            <Badge className={
                              order.status === "delivered" ? "bg-green-100 text-green-800" :
                              order.status === "canceled" ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            }>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Date:</span> 
                              <span className="ml-1">{format(new Date(order.order_date), "MMM d, yyyy")}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="ml-1 font-medium">${order.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto mt-2" 
                            onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No orders found for this customer</p>
              )}
            </TabsContent>
            
            <TabsContent value="visits" className="mt-4">
              {isLoadingRelated ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : customerVisits.length > 0 ? (
                <div className="space-y-4">
                  {customerVisits.map((visit) => (
                    <Card key={visit.id} className="overflow-hidden">
                      <div className="flex items-start p-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">
                              Visit on {format(new Date(visit.visit_date), "MMM d, yyyy")}
                            </h4>
                            <Badge className={
                              visit.status === "completed" ? "bg-green-100 text-green-800" :
                              visit.status === "skipped" ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            }>
                              {visit.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Time:</span> 
                              <span className="ml-1">{visit.visit_time}</span>
                            </div>
                            {visit.notes && (
                              <div className="col-span-2 mt-1">
                                <span className="text-muted-foreground">Notes:</span>
                                <span className="ml-1">{visit.notes}</span>
                              </div>
                            )}
                          </div>
                          {visit.route_id && (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto mt-2" 
                              onClick={() => navigate(`/dashboard/routes/${visit.route_id}`)}
                            >
                              View Route
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No visits found for this customer</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/routes/create")}>
              <Map className="mr-2 h-4 w-4" />
              Add to Route
            </Button>
            <Button onClick={() => navigate(`/dashboard/orders/add?customer=${customer.id}`)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
