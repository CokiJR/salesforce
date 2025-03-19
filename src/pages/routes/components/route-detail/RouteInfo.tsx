
import { format } from "date-fns";
import { DailyRoute } from "@/types";
import { Separator } from "@/components/ui/separator";

interface RouteInfoProps {
  route: DailyRoute;
}

export function RouteInfo({ route }: RouteInfoProps) {
  return (
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
  );
}
