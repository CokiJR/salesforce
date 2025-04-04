
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Collection } from '@/types/collection';

export default function AddCollection() {
  const navigate = useNavigate();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceNumber || !customerName || !amount || !dueDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newCollection = {
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_id: '00000000-0000-0000-0000-000000000000', // Default customer ID
        amount: parseFloat(amount),
        due_date: dueDate.toISOString(),
        status: 'Unpaid' as const,
      };
      
      // Check for duplicate invoice number
      const { data: existingCollection } = await supabase
        .from('collections')
        .select('id')
        .eq('invoice_number', invoiceNumber)
        .maybeSingle();
        
      if (existingCollection) {
        toast({
          variant: "destructive",
          title: "Duplicate invoice",
          description: "An invoice with this number already exists",
        });
        return;
      }
      
      // Fix: directly insert the object (not as an array)
      const { error } = await supabase
        .from('collections')
        .insert(newCollection);
      
      if (error) throw error;
      
      toast({
        title: "Collection added",
        description: "The collection has been successfully added",
      });
      
      navigate('/dashboard/collections');
      
    } catch (error: any) {
      console.error('Error adding collection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add collection: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Collection</h2>
        <p className="text-muted-foreground">
          Add a new invoice for collection
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
          <CardDescription>
            Enter the details for the new collection
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number *</Label>
                <Input
                  id="invoice-number"
                  placeholder="Enter invoice number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left ${!dueDate ? 'text-muted-foreground' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate('/dashboard/collections')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Collection'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
