
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DailyRoute } from "@/types";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Loader2, Map, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const Routes = () => {
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, [date]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const formattedDate = format(date, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_routes")
        .select("*")
        .eq("date", formattedDate);

      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      console.error("Error fetching routes:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load routes: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = () => {
    navigate("/dashboard/routes/create");
  };

  const handleRouteDetails = (routeId: string) => {
    navigate(`/dashboard/routes/${routeId}`);
  };

  const getStatusSummary = (route: DailyRoute) => {
    const completed = route.stops.filter(stop => stop.status === "completed").length;
    const total = route.stops.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completed,
      total,
      percentage
    };
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Daily Routes</h1>
        <Button onClick={handleCreateRoute}>
          <Plus className="mr-2 h-4 w-4" />
          Create Route
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : routes.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => {
                const status = getStatusSummary(route);
                return (
                  <TableRow 
                    key={route.id} 
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => handleRouteDetails(route.id)}
                  >
                    <TableCell className="font-medium">{route.id.substring(0, 8)}</TableCell>
                    <TableCell>{format(new Date(route.date), "EEEE, MMMM d, yyyy")}</TableCell>
                    <TableCell>{status.total} stops</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${status.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          {status.completed}/{status.total} ({status.percentage}%)
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3">
            <Map className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No routes found for {format(date, "MMMM d, yyyy")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Plan your customer visits by creating a route
          </p>
          <Button onClick={handleCreateRoute} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Button>
        </div>
      )}
    </div>
  );
};

export default Routes;
