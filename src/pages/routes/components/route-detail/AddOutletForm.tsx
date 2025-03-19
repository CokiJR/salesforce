
import { useState } from "react";
import { format } from "date-fns";
import { Customer, RouteStop } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

interface AddOutletFormProps {
  routeId: string;
  routeDate: string;
  existingStops: RouteStop[];
}

export function AddOutletForm({ routeId, routeDate, existingStops }: AddOutletFormProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [visitTime, setVisitTime] = useState<string>("09:00");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      setCustomers(data as Customer[]);
    } catch (error: any) {
      console.error("Error fetching customers:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load customers: ${error.message}`,
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch customers when component mounts
  useState(() => {
    fetchCustomers();
  });

  const handleAddOutlet = async () => {
    if (!selectedCustomerId || !visitTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a customer and visit time",
      });
      return;
    }
    
    try {
      if (existingStops.some(stop => stop.customer_id === selectedCustomerId)) {
        toast({
          variant: "destructive",
          title: "Customer already added",
          description: "This customer is already part of this route",
        });
        return;
      }
      
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (!customer) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Selected customer not found",
        });
        return;
      }
      
      const newStop = {
        route_id: routeId,
        customer_id: selectedCustomerId,
        visit_date: routeDate,
        visit_time: visitTime,
        status: "pending",
        notes: "",
        coverage_status: "Uncover Location",
        visited: false,
        barcode_scanned: false
      };
      
      const { data, error } = await supabase
        .from("route_stops")
        .insert(newStop)
        .select("*, customer:customers(*)");
      
      if (error) throw error;
      
      toast({
        title: "Outlet added",
        description: "The outlet has been added to this route",
      });
      
      window.location.reload();
    } catch (error: any) {
      console.error("Error adding outlet:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add outlet: ${error.message}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Outlet to Route</CardTitle>
        <CardDescription>
          Add a new outlet to this route. The outlet will be marked as "Uncover Location".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent>
                {loadingCustomers ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.city}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="time"
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              placeholder="Visit time"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleAddOutlet}>
          <Plus className="mr-2 h-4 w-4" />
          Add to Route
        </Button>
      </CardFooter>
    </Card>
  );
}
