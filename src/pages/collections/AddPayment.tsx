
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Collection } from '@/types/collection';
import { usePayments } from './hooks/usePayments';

export default function AddPayment() {
  const navigate = useNavigate();
  const { unpaidCollections, createPayment } = usePayments();
  
  const [collectionId, setCollectionId] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [customerId, setCustomerId] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update customer and bank account when collection changes
  useEffect(() => {
    if (collectionId && unpaidCollections.length > 0) {
      const collection = unpaidCollections.find(c => c.id === collectionId);
      if (collection) {
        setSelectedCollection(collection);
        setCustomerId(collection.customer_id);
        
        // Set bank account if available from customer
        if (collection.customer && collection.customer.bank_account) {
          setBankAccount(collection.customer.bank_account);
        } else {
          setBankAccount('');
        }
      }
    }
  }, [collectionId, unpaidCollections]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collectionId || !customerId || !bankAccount || !amount || !paymentDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }
    
    if (selectedCollection && parseFloat(amount) > selectedCollection.amount) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Payment amount cannot exceed the collection amount",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newPayment = {
        collection_id: collectionId,
        customer_id: customerId,
        bank_account: bankAccount,
        amount: parseFloat(amount),
        payment_date: paymentDate.toISOString(),
        status: 'Pending' as const
      };
      
      await createPayment(newPayment);
      
      toast({
        title: "Payment added",
        description: "The payment has been successfully recorded",
      });
      
      navigate('/dashboard/payments');
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add payment: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Payment</h2>
        <p className="text-muted-foreground">
          Record a new payment for a collection
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Enter the details for the new payment
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-id">Collection *</Label>
              <Select 
                value={collectionId} 
                onValueChange={setCollectionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidCollections.map(collection => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.invoice_number} - {collection.customer_name} (${collection.amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCollection && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Input
                    id="customer"
                    value={selectedCollection.customer_name}
                    readOnly
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account">Bank Account *</Label>
                  <Input
                    id="bank-account"
                    placeholder="Enter bank account number"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
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
                {selectedCollection && (
                  <p className="text-xs text-muted-foreground">
                    Collection Amount: ${selectedCollection.amount}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => date && setPaymentDate(date)}
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
              onClick={() => navigate('/dashboard/payments')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Payment'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
