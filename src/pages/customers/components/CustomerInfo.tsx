
import { Customer } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Building, Mail, MapPin, Phone, User, Calendar, CreditCard, BadgeDollarSign } from "lucide-react";
import { getPaymentTermDescription } from "../utils/paymentTerms";

interface CustomerInfoProps {
  customer: Customer;
  getCycleDescription: (cycle: string) => string;
}

export function CustomerInfo({ customer, getCycleDescription }: CustomerInfoProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold">{customer.name}</h2>
        <Badge className={customer.status === "active" ? "bg-green-500" : "bg-red-500"}>
          {customer.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{customer.contact_person}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{customer.phone}</span>
          </div>
          
          {customer.email && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{customer.email}</span>
            </div>
          )}
          
          <div className="flex items-start space-x-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5" />
            <span>{customer.address}, {customer.city}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Visit Cycle: {getCycleDescription(customer.cycle)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>Customer ID: {customer.id}</span>
          </div>
          
          {customer.payment_term && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <BadgeDollarSign className="h-4 w-4" />
              <span>Payment Term: {customer.payment_term} - {getPaymentTermDescription(customer.payment_term)}</span>
            </div>
          )}
          
          {customer.bank_account && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Bank Account: {customer.bank_account}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
