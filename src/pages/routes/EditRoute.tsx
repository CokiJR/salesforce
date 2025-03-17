
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DailyRoute, RouteStop } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const EditRoute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<DailyRoute | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch route data
  useEffect(() => {
    const fetchRoute = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch route data
        const { data: routeData, error: routeError } = await supabase
          .from("daily_routes")
          .select("*")
          .eq("id", id)
          .single();
        
        if (routeError) throw routeError;
        
        // Fetch route stops with customer details
        const { data: stopsData, error: stopsError } = await supabase
          .from("route_stops")
          .select(`
            *,
            customer:customers(*)
          `)
          .eq("route_id", id)
          .order("visit_time");
        
        if (stopsError) throw stopsError;
        
        // Process the stops data
        const processedStops = stopsData.map((stop: any) => ({
          ...stop,
          customer: {
            ...stop.customer,
            cycle: stop.customer.cycle || "YYYY",
            status: stop.customer.status as "active" | "inactive",
            location: stop.customer.location ? {
              lat: Number((stop.customer.location as any).lat || 0),
              lng: Number((stop.customer.location as any).lng || 0)
            } : undefined
          }
        })) as RouteStop[];
        
        // Set the route and stops data
        setRoute({
          ...routeData,
          stops: processedStops
        });
        
        setStops(processedStops);
      } catch (error: any) {
        console.error("Error fetching route:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load route: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [id]);

  // Handle status change for a stop
  const handleStatusChange = (stopId: string, status: "pending" | "completed" | "skipped") => {
    setStops(prevStops => 
      prevStops.map(stop => 
        stop.id === stopId ? { ...stop, status } : stop
      )
    );
  };

  // Handle notes change for a stop
  const handleNotesChange = (stopId: string, notes: string) => {
    setStops(prevStops => 
      prevStops.map(stop => 
        stop.id === stopId ? { ...stop, notes } : stop
      )
    );
  };

  // Mark all stops as completed
  const handleMarkAllCompleted = () => {
    setStops(prevStops => 
      prevStops.map(stop => ({ ...stop, status: "completed" }))
    );
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update each stop in the database
      for (const stop of stops) {
        const { error } = await supabase
          .from("route_stops")
          .update({ 
            status: stop.status,
            notes: stop.notes
          })
          .eq("id", stop.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Route updated",
        description: "Route has been successfully updated",
      });
      
      navigate(`/dashboard/routes/${id}`);
    } catch (error: any) {
      console.error("Error updating route:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update route: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">Route not found</h2>
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard/routes")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Routes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/routes/${id}`)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Route</h1>
        </div>
        <div className="flex gap-2">
          {stops.some(stop => stop.status !== "completed") && (
            <Button variant="default" onClick={handleMarkAllCompleted}>
              <Check className="mr-2 h-4 w-4" />
              Mark All Completed
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Route ID</p>
              <p>{route.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p>{format(new Date(route.date), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>

          <Separator className="my-6" />
          
          <h3 className="text-lg font-medium mb-4">Scheduled Stops</h3>
          
          {stops.length > 0 ? (
            <div className="space-y-4">
              {stops.map((stop) => (
                <Card key={stop.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold">{stop.customer.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stop.customer.address}, {stop.customer.city}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Visit time: {stop.visit_time}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full md:w-48">
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select 
                            value={stop.status} 
                            onValueChange={(value) => handleStatusChange(stop.id, value as "pending" | "completed" | "skipped")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="skipped">Skipped</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea 
                        value={stop.notes || ""} 
                        onChange={(e) => handleNotesChange(stop.id, e.target.value)}
                        placeholder="Add notes about this stop"
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No stops scheduled for this route</p>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/dashboard/routes/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditRoute;
