
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { useAuthentication } from "@/hooks/useAuthentication";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { useRouteData } from "./hooks/useRouteData";
import { RouteForm, RouteFormValues } from "./components/RouteForm";
import { AddStopForm } from "./components/AddStopForm";
import { RouteStopsTable } from "./components/RouteStopsTable";
import { RouteSummaryPanel } from "./components/RouteSummaryPanel";

// Stop schema type
type RouteStop = {
  customer_id: string;
  customer: Customer;
  visit_time: string;
  notes?: string;
  coverage_status: string;
};

export default function CreateRoute() {
  const { user } = useAuthentication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers, loadingItems } = useRouteData();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [visitTime, setVisitTime] = useState<string>("09:00");
  const [notes, setNotes] = useState<string>("");
  const [isManualRoute, setIsManualRoute] = useState(false);
  const navigate = useNavigate();

  // Handle adding a stop to the route
  const handleAddStop = () => {
    if (!selectedCustomer || !visitTime) return;
    
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return;
    
    // Check if customer is already in the stops list
    if (stops.some(stop => stop.customer_id === selectedCustomer)) {
      toast({
        variant: "destructive",
        title: "Duplicate customer",
        description: "This customer is already added to the route.",
      });
      return;
    }
    
    const newStop = {
      customer_id: customer.id,
      customer: customer,
      visit_time: visitTime,
      notes: notes,
      coverage_status: isManualRoute ? "Uncover Location" : "Cover Location"
    };
    
    setStops([...stops, newStop]);
    setSelectedCustomer("");
    setVisitTime("09:00");
    setNotes("");
  };

  // Handle removing a stop from the route
  const handleRemoveStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };

  // Handle form submission
  const onSubmit = async (data: RouteFormValues) => {
    if (stops.length === 0) {
      toast({
        variant: "destructive",
        title: "No stops added",
        description: "Please add at least one customer stop to the route.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create route object
      const routeData = {
        date: format(data.date, "yyyy-MM-dd"),
        salesperson_id: user?.id,
      };
      
      // Insert route
      const { data: newRoute, error: routeError } = await supabase
        .from("daily_routes")
        .insert(routeData)
        .select("*")
        .single();
      
      if (routeError) throw routeError;
      
      // Insert route stops
      const routeStopsData = stops.map(stop => ({
        route_id: newRoute.id,
        customer_id: stop.customer_id,
        visit_date: format(data.date, "yyyy-MM-dd"),
        visit_time: stop.visit_time,
        status: "pending",
        notes: stop.notes || "",
        coverage_status: stop.coverage_status,
        barcode_scanned: false,
        visited: false
      }));
      
      const { error: stopsError } = await supabase
        .from("route_stops")
        .insert(routeStopsData);
      
      if (stopsError) throw stopsError;
      
      toast({
        title: "Route created",
        description: `Route for ${format(data.date, "MMMM d, yyyy")} has been created successfully.`,
      });
      
      navigate("/dashboard/routes");
    } catch (error: any) {
      console.error("Error creating route:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create route: ${error.message}`,
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
            onClick={() => navigate("/dashboard/routes")}
            className="rounded-full"
            aria-label="Back to routes"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create Route</h1>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <RouteForm
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => navigate("/dashboard/routes")}
            hasStops={stops.length > 0}
            isManualRoute={isManualRoute}
            setIsManualRoute={setIsManualRoute}
            stopsComponent={
              <>
                <AddStopForm
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  visitTime={visitTime}
                  notes={notes}
                  onCustomerChange={setSelectedCustomer}
                  onVisitTimeChange={setVisitTime}
                  onNotesChange={setNotes}
                  onAddStop={handleAddStop}
                  isManualRoute={isManualRoute}
                />
                
                <RouteStopsTable
                  stops={stops}
                  onRemoveStop={handleRemoveStop}
                  showCoverageStatus={true}
                />
              </>
            }
          />
        </div>
        
        <div className="md:col-span-1">
          <RouteSummaryPanel
            stopsCount={stops.length}
            routeDate={new Date()}
            isManualRoute={isManualRoute}
          />
        </div>
      </div>
    </div>
  );
}
