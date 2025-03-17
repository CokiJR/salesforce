
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DailyRoute, RouteStop } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Edit, Trash2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RouteDetailViewProps {
  route: DailyRoute | null;
  isLoading: boolean;
}

export function RouteDetailView({ route, isLoading }: RouteDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleEdit = () => {
    if (route) {
      navigate(`/dashboard/routes/edit/${route.id}`);
    }
  };

  const handleMarkCompleted = () => {
    if (route) {
      navigate(`/dashboard/routes/edit/${route.id}`);
    }
  };

  const handleDelete = async () => {
    if (!route) return;

    try {
      setIsDeleting(true);
      
      // First delete all route stops
      const { error: stopsError } = await supabase
        .from("route_stops")
        .delete()
        .eq("route_id", route.id);
      
      if (stopsError) throw stopsError;
      
      // Then delete the route itself
      const { error: routeError } = await supabase
        .from("daily_routes")
        .delete()
        .eq("id", route.id);
      
      if (routeError) throw routeError;
      
      toast({
        title: "Route deleted",
        description: "The route has been successfully deleted",
      });
      
      navigate("/dashboard/routes");
    } catch (error: any) {
      console.error("Error deleting route:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete route: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "skipped":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
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
                  This action cannot be undone. This will permanently delete the route
                  and all associated stops.
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
                          <Badge className={getStatusColor(stop.status)}>
                            {stop.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {stop.customer.address}, {stop.customer.city}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <span className="font-medium">Visit time:</span>
                          <span className="ml-2">{stop.visit_time}</span>
                        </div>
                        {stop.notes && (
                          <p className="mt-2 text-sm border-t pt-2">
                            <span className="font-medium">Notes:</span> {stop.notes}
                          </p>
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
          <div className="flex gap-2">
            {route.stops.some(stop => stop.status !== "completed") && (
              <Button variant="default" onClick={handleMarkCompleted}>
                <Check className="mr-2 h-4 w-4" />
                Mark Completed
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
