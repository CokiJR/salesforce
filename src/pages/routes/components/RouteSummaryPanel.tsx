
import { format } from "date-fns";
import { MapPin } from "lucide-react";

interface RouteSummaryPanelProps {
  stopsCount: number;
  routeDate: Date;
  isManualRoute?: boolean;
}

export function RouteSummaryPanel({ stopsCount, routeDate, isManualRoute = false }: RouteSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center sticky top-6">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Route Summary</h3>
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Route Date:</span>
          <span className="font-medium">{format(routeDate, "MMM d, yyyy")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Stops:</span>
          <span className="font-medium">{stopsCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Route Type:</span>
          <span className="font-medium">{isManualRoute ? "Manual" : "Auto-generated"}</span>
        </div>
        {isManualRoute && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Coverage:</span>
            <span className="font-medium text-orange-700">Uncover Location</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Configure your sales route stops using the form.
      </p>
    </div>
  );
}
