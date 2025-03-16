
import { format } from "date-fns";
import { MapPin } from "lucide-react";

interface RouteSummaryPanelProps {
  stopsCount: number;
  routeDate: Date | undefined;
}

export function RouteSummaryPanel({ stopsCount, routeDate }: RouteSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center sticky top-6">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Route Information</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Create a route by adding customer stops in the order they should be visited.
      </p>
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Stops:</span>
          <span className="font-medium">{stopsCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Selected Date:</span>
          <span className="font-medium">
            {routeDate ? format(routeDate, 'MMM d, yyyy') : 'Not selected'}
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>Schedule customer visits efficiently by planning your route in advance</p>
      </div>
    </div>
  );
}
