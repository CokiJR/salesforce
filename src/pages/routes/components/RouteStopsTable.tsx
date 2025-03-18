
import { MapPin, Trash2 } from "lucide-react";
import { Customer } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RouteStop = {
  customer_id: string;
  customer: Customer;
  visit_time: string;
  notes?: string;
  coverage_status?: string;
};

interface RouteStopsTableProps {
  stops: RouteStop[];
  onRemoveStop: (index: number) => void;
  showCoverageStatus?: boolean;
}

export function RouteStopsTable({ stops, onRemoveStop, showCoverageStatus = false }: RouteStopsTableProps) {
  // Sort stops by visit time
  const sortedStops = [...stops].sort((a, b) => {
    return a.visit_time.localeCompare(b.visit_time);
  });

  const getCoverageStatusColor = (status?: string) => {
    return status === "Cover Location" 
      ? "bg-green-100 text-green-800" 
      : "bg-orange-100 text-orange-800";
  };

  if (sortedStops.length === 0) {
    return (
      <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No stops added to this route yet</p>
        <p className="text-xs text-muted-foreground mt-1">Use the form above to add customer stops</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Address</TableHead>
            {showCoverageStatus && <TableHead>Coverage</TableHead>}
            <TableHead>Notes</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStops.map((stop, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{stop.visit_time}</TableCell>
              <TableCell>{stop.customer.name}</TableCell>
              <TableCell>
                {stop.customer.address}, {stop.customer.city}
              </TableCell>
              {showCoverageStatus && (
                <TableCell>
                  <Badge className={getCoverageStatusColor(stop.coverage_status)}>
                    {stop.coverage_status || "Cover Location"}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="max-w-[200px] truncate">
                {stop.notes || "-"}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveStop(index)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
