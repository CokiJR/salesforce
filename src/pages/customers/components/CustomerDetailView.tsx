
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Customer, Order, RouteStop } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { CustomerHeader } from "./CustomerHeader";
import { CustomerInfo } from "./CustomerInfo";
import { CustomerOrdersList } from "./CustomerOrdersList";
import { CustomerVisitsList } from "./CustomerVisitsList";
import { CustomerActions } from "./CustomerActions";
import { CustomerDataService } from "../services/CustomerDataService";
import { getCycleDescription } from "../utils/CustomerCycles";

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

  useEffect(() => {
    if (customer) {
      fetchRelatedData(customer.id);
    }
  }, [customer]);

  const fetchRelatedData = async (customerId: string) => {
    if (!customer) return;
    
    setIsLoadingRelated(true);
    try {
      const { orders, visits } = await CustomerDataService.fetchRelatedData(customerId, customer);
      setCustomerOrders(orders);
      setCustomerVisits(visits);
    } catch (error: any) {
      console.error("Error fetching related data:", error.message);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      setIsDeleting(true);
      await CustomerDataService.deleteCustomer(customer.id);
      
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
          <h2 className="text-xl font-semibold">No Customer Selected</h2>
          <p className="text-sm text-muted-foreground">
            Select a customer from the list to view their details
          </p>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <CustomerActions customerId="" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CustomerHeader 
        customer={customer} 
        isDeleting={isDeleting} 
        onDelete={handleDelete}
      />

      <Card>
        <CardHeader>
          <CustomerInfo 
            customer={customer} 
            getCycleDescription={getCycleDescription} 
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Orders History</TabsTrigger>
              <TabsTrigger value="visits">Visit History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-4">
              <CustomerOrdersList 
                orders={customerOrders} 
                isLoading={isLoadingRelated} 
              />
            </TabsContent>
            
            <TabsContent value="visits" className="mt-4">
              <CustomerVisitsList 
                visits={customerVisits} 
                isLoading={isLoadingRelated} 
              />
            </TabsContent>
          </Tabs>

          <CustomerActions customerId={customer.id} />
        </CardContent>
      </Card>
    </div>
  );
}
