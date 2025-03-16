
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

type RouteStop = {
  customer_id: string;
  customer: Customer;
  visit_time: string;
  notes?: string;
};

interface RouteStopsTableProps {
  stops: RouteStop[];
  onRemoveStop: (index: number) => void;
}

export function RouteStopsTable({ stops, onRemoveStop }: RouteStopsTableProps) {
  // Sort stops by visit time
  const sortedStops = [...stops].sort((a, b) => {
    return a.visit_time.localeCompare(b.visit_time);
  });

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
