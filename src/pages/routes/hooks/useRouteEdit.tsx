
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DailyRoute, RouteStop } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useRouteEdit = () => {
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
          },
          coverage_status: stop.coverage_status || "Cover Location",
          barcode_scanned: stop.barcode_scanned || false,
          visited: stop.visited || false
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

  return {
    id,
    route,
    stops,
    loading,
    saving,
    navigate,
    handleStatusChange,
    handleNotesChange,
    handleMarkAllCompleted,
    handleSave
  };
};
