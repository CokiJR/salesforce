
import { Customer } from "@/types";
import { format } from "date-fns";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CustomerInfoProps {
  customer: Customer;
  getCycleDescription: (cycle: string) => string;
}

export function CustomerInfo({ customer, getCycleDescription }: CustomerInfoProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{customer.name}</CardTitle>
          <CardDescription>{customer.address}, {customer.city}</CardDescription>
        </div>
        <Badge className={customer.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {customer.status}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
          <p>{customer.contact_person}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Phone</p>
          <p>{customer.phone}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p>{customer.email || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Visit Cycle</p>
          <p>{getCycleDescription(customer.cycle)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Created</p>
          <p>{format(new Date(customer.created_at), "MMM d, yyyy")}</p>
        </div>
      </div>
    </>
  );
}
