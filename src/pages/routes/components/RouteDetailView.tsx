import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DailyRoute, RouteStop, Customer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, ShoppingBag, QrCode, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarcodeScanner } from "./BarcodeScanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface RouteDetailViewProps {
  route: DailyRoute | null;
  isLoading: boolean;
}

export function RouteDetailView({ route, isLoading }: RouteDetailViewProps) {
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [currentStopId, setCurrentStopId] = useState<string | null>(null);
  const [addingOutlet, setAddingOutlet] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [visitTime, setVisitTime] = useState<string>("09:00");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const navigate = useNavigate();

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

  const toggleAddOutlet = () => {
    const newState = !addingOutlet;
    setAddingOutlet(newState);
    
    if (newState) {
      fetchCustomers();
    }
  };

  const handleAddOutlet = async () => {
    if (!route || !selectedCustomerId || !visitTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a customer and visit time",
      });
      return;
    }
    
    try {
      if (route.stops.some(stop => stop.customer_id === selectedCustomerId)) {
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
        route_id: route.id,
        customer_id: selectedCustomerId,
        visit_date: route.date,
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

  const handleCreateOrder = (customerId: string, stopId: string) => {
    navigate(`/dashboard/orders/add?customer=${customerId}&route_stop_id=${stopId}`);
  };

  const handleScanBarcode = (stopId: string) => {
    setCurrentStopId(stopId);
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanComplete = async (barcode: string) => {
    setShowBarcodeScanner(false);
    
    if (!currentStopId) return;
    
    try {
      const now = new Date();
      const { error } = await supabase
        .from("route_stops")
        .update({ 
          barcode_scanned: true,
          visited: true,
          visit_date: format(now, "yyyy-MM-dd"),
          visit_time: format(now, "HH:mm:ss")
        })
        .eq("id", currentStopId);
      
      if (error) throw error;
      
      toast({
        title: "Barcode scanned successfully",
        description: "Customer location has been marked as visited",
      });
      
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating stop:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update stop: ${error.message}`,
      });
    }
  };

  const handleSkipScanning = async () => {
    setShowBarcodeScanner(false);
    
    if (!currentStopId) return;
    
    try {
      const now = new Date();
      const { error } = await supabase
        .from("route_stops")
        .update({ 
          visited: true,
          visit_date: format(now, "yyyy-MM-dd"),
          visit_time: format(now, "HH:mm:ss")
        })
        .eq("id", currentStopId);
      
      if (error) throw error;
      
      toast({
        title: "Visit recorded",
        description: "Customer location has been marked as visited without barcode scanning",
      });
      
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating stop:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update stop: ${error.message}`,
      });
    }
  };

  const handleMarkSkipped = async (stopId: string) => {
    try {
      const now = new Date();
      const { error } = await supabase
        .from("route_stops")
        .update({ 
          status: "skipped",
          visit_date: format(now, "yyyy-MM-dd"),
          visit_time: format(now, "HH:mm:ss")
        })
        .eq("id", stopId);
      
      if (error) throw error;
      
      toast({
        title: "Stop skipped",
        description: "Customer location has been marked as skipped",
      });
      
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating stop:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update stop: ${error.message}`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "skipped":
        return "bg-yellow-100 text-yellow-800";
      case "not_ordered":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getCoverageStatusColor = (status: string) => {
    return status === "Cover Location" 
      ? "bg-green-100 text-green-800" 
      : "bg-orange-100 text-orange-800";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!route) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Route Selected</CardTitle>
          <CardDescription>
            Select a route from the list to view its details
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard/routes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Routes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showBarcodeScanner && (
        <AlertDialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Scan Outlet Barcode</AlertDialogTitle>
              <AlertDialogDescription>
                Scan the outlet barcode to validate your visit. This will mark the location as visited.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <BarcodeScanner onScan={handleBarcodeScanComplete} />
            </div>
            <AlertDialogFooter className="sm:justify-between">
              <AlertDialogCancel onClick={() => setShowBarcodeScanner(false)}>
                Cancel
              </AlertDialogCancel>
              <Button onClick={handleSkipScanning}>
                Skip Scanning
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/routes")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Route Details</h1>
        </div>
        <div>
          <Button 
            variant="outline" 
            onClick={toggleAddOutlet}
          >
            <Plus className="mr-2 h-4 w-4" />
            {addingOutlet ? "Cancel" : "Add Outlet"}
          </Button>
        </div>
      </div>

      {addingOutlet && (
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>Route Information</CardTitle>
          <CardDescription>
            Details for route on {format(new Date(route.date), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Route ID</p>
              <p>{route.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p>{format(new Date(route.date), "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{format(new Date(route.created_at), "MMM d, yyyy h:mm a")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Stops</p>
              <p>{route.stops.length} customer locations</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Scheduled Stops</h3>
            {route.stops.length > 0 ? (
              <div className="space-y-4">
                {route.stops.map((stop: RouteStop) => (
                  <Card key={stop.id} className="overflow-hidden">
                    <div className="flex items-start p-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{stop.customer.name}</h4>
                          <div className="flex gap-2">
                            <Badge className={getCoverageStatusColor(stop.coverage_status || "Cover Location")}>
                              {stop.coverage_status || "Cover Location"}
                            </Badge>
                            <Badge className={getStatusColor(stop.status)}>
                              {stop.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {stop.customer.address}, {stop.customer.city}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <span className="font-medium">Visit time:</span>
                          <span className="ml-2">{stop.visit_time}</span>
                        </div>
                        {stop.visited && (
                          <div className="flex items-center mt-1 text-sm">
                            <span className="font-medium">Visited:</span>
                            <span className="ml-2 text-green-600">Yes</span>
                          </div>
                        )}
                        {stop.barcode_scanned && (
                          <div className="flex items-center mt-1 text-sm">
                            <span className="font-medium">Barcode scanned:</span>
                            <span className="ml-2 text-green-600">Yes</span>
                          </div>
                        )}
                        {stop.notes && (
                          <p className="mt-2 text-sm border-t pt-2">
                            <span className="font-medium">Notes:</span> {stop.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {!stop.visited && stop.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleScanBarcode(stop.id)}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Scan Barcode
                          </Button>
                        )}
                        
                        {(stop.visited || stop.status === "pending") && stop.status !== "completed" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleCreateOrder(stop.customer_id, stop.id)}
                          >
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Order
                          </Button>
                        )}
                        
                        {stop.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleMarkSkipped(stop.id)}
                          >
                            X
                            Skip
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No stops scheduled for this route</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard/routes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Routes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
