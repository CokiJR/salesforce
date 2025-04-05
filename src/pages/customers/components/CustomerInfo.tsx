
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, CreditCard, Calendar, Banknote } from "lucide-react";
import { Customer } from "@/types";

interface CustomerInfoProps {
  customer: Customer;
}

export const CustomerInfo = ({ customer }: CustomerInfoProps) => {
  // Function to get cycle description
  const getCycleDescription = (cycle: string) => {
    switch(cycle) {
      case 'YYYY':
        return 'Every Week';
      case 'YTYT':
        return 'Week 1 & 3';
      case 'TYTY':
        return 'Week 2 & 4';
      default:
        return cycle;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{customer.address}, {customer.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.payment_term && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Payment Terms: {customer.payment_term_description || customer.payment_term}</span>
              </div>
            )}
            {customer.bank_account && (
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>Bank Account: {customer.bank_account}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contact Person</span>
              <span className="font-medium">{customer.contact_person}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={customer.status === "active" 
                  ? "bg-green-100 text-green-800 hover:bg-green-200" 
                  : "bg-red-100 text-red-800 hover:bg-red-200"
                }>
                {customer.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Visit Cycle</span>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{getCycleDescription(customer.cycle)}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
