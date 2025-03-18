
import { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddStopFormProps {
  customers: Customer[];
  selectedCustomer: string;
  visitTime: string;
  notes: string;
  onCustomerChange: (value: string) => void;
  onVisitTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onAddStop: () => void;
  isManualRoute?: boolean;
}

export function AddStopForm({
  customers,
  selectedCustomer,
  visitTime,
  notes,
  onCustomerChange,
  onVisitTimeChange,
  onNotesChange,
  onAddStop,
  isManualRoute = false
}: AddStopFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Customer Stops</h3>
      
      {isManualRoute && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a manual route. All stops will be marked as "Uncover Location".
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Select value={selectedCustomer} onValueChange={onCustomerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Input
            type="time"
            value={visitTime}
            onChange={(e) => onVisitTimeChange(e.target.value)}
            placeholder="Visit time"
          />
        </div>
        
        <div>
          <Button 
            type="button" 
            onClick={onAddStop}
            className="w-full"
            variant="secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stop
          </Button>
        </div>
      </div>
      
      <div>
        <Textarea
          placeholder="Notes for this stop (optional)"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}
