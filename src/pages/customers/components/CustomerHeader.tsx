
import { Button } from "@/components/ui/button";
import { Customer } from "@/types";
import { Edit, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerHeaderProps {
  customer: Customer;
}

export function CustomerHeader({ customer }: CustomerHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
        <p className="text-muted-foreground">
          {customer.address}, {customer.city}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate(`/dashboard/customers/edit/${customer.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
