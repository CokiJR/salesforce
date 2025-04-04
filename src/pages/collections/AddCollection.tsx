
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AddCollection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [openCalendar, setOpenCalendar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceNumber || !customerName || !amount || !dueDate) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill all required fields",
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('collections')
        .insert({
          invoice_number: invoiceNumber,
          customer_name: customerName,
          amount: parseFloat(amount),
          due_date: dueDate.toISOString(),
          status: 'Unpaid'
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Collection added",
        description: "A new collection has been successfully added",
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
      setSaving(false);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Add Collection</CardTitle>
          <CardDescription>Create a new collection for payment tracking</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number*</Label>
                <Input 
                  id="invoiceNumber" 
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2023-001" 
                />
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name*</Label>
                <Input 
                  id="customerName" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer name" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount*</Label>
                <Input 
                  id="amount" 
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" 
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date*</Label>
                <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setOpenCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/collections')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Collection
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddCollection;
