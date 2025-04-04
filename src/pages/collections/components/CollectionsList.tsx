import { useState } from 'react';
import { format } from 'date-fns';
import { Customer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertCircle } from 'lucide-react';

interface CollectionsListProps {
  customers: Customer[];
  isLoading: boolean;
}

export function CollectionsList({ customers, isLoading }: CollectionsListProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');
  
  // Filter customers based on due date
  const filteredCustomers = customers.filter(customer => {
    if (!customer.due_date) return false;
    
    const dueDate = new Date(customer.due_date);
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (filter === 'all') return true;
    if (filter === 'overdue') return daysDiff < 0;
    if (filter === 'upcoming') return daysDiff >= 0 && daysDiff <= 7;
    
    return true;
  });
  
  // Sort customers by due date (closest first)
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
  
  const getDueDateStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const timeDiff = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return { status: 'overdue', badge: 'bg-red-100 text-red-800', days: Math.abs(daysDiff) };
    } else if (daysDiff <= 7) {
      return { status: 'upcoming', badge: 'bg-yellow-100 text-yellow-800', days: daysDiff };
    } else {
      return { status: 'scheduled', badge: 'bg-green-100 text-green-800', days: daysDiff };
    }
  };
  
  const handleScheduleCollection = (customerId: string) => {
    navigate(`/dashboard/routes/create?collection=${customerId}`);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Collections</CardTitle>
            <CardDescription>Manage customer payment collections</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'overdue' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('overdue')}
            >
              <AlertCircle className="mr-1 h-4 w-4" />
              Overdue
            </Button>
            <Button 
              variant={filter === 'upcoming' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('upcoming')}
            >
              <Calendar className="mr-1 h-4 w-4" />
              Upcoming
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sortedCustomers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer) => {
                if (!customer.due_date) return null;
                
                const { status, badge, days } = getDueDateStatus(customer.due_date);
                
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <div>
                        {customer.name}
                        <div className="text-xs text-muted-foreground">{customer.address}, {customer.city}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(customer.due_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={badge}>
                        {status === 'overdue' ? `${days} days overdue` : 
                         status === 'upcoming' ? `Due in ${days} days` : 
                         `Due in ${days} days`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.bank_account ? (
                        <div className="font-mono text-sm">
                          {customer.bank_account}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No account</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleCollection(customer.id)}
                      >
                        <Calendar className="mr-1 h-4 w-4" />
                        Schedule Collection
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">No collections found</p>
            <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
              Show All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}