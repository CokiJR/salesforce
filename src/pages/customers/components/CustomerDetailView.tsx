
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerHeader } from './CustomerHeader';
import { CustomerInfo } from './CustomerInfo';
import { CustomerOrdersList } from './CustomerOrdersList';
import { CustomerVisitsList } from './CustomerVisitsList';
import { Customer } from '@/types';
import { getCustomerCycleDescription } from '../utils/CustomerCycles';

interface CustomerDetailViewProps {
  customer: Customer;
  onEdit: () => void;
}

export function CustomerDetailView({ customer, onEdit }: CustomerDetailViewProps) {
  const [activeTab, setActiveTab] = useState('info');

  const getCycleDescription = (cycle: string): string => {
    return getCustomerCycleDescription(cycle);
  };

  return (
    <div className="space-y-6">
      <CustomerHeader 
        customer={customer} 
        onEdit={onEdit} 
      />
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            {activeTab === 'orders' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Handle navigation to add order page
                  window.location.href = `/dashboard/orders/add?customerId=${customer.id}`;
                }}
              >
                Add Order
              </Button>
            )}
            
            {activeTab === 'visits' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Handle navigation to add visit page
                  window.location.href = `/dashboard/routes/create?customerId=${customer.id}`;
                }}
              >
                Schedule Visit
              </Button>
            )}
          </div>
        </div>
        
        <TabsContent value="info" className="mt-0">
          <CustomerInfo 
            customer={customer} 
            getCycleDescription={getCycleDescription} 
          />
        </TabsContent>
        
        <TabsContent value="orders" className="mt-0">
          <CustomerOrdersList customerId={customer.id} />
        </TabsContent>
        
        <TabsContent value="visits" className="mt-0">
          <CustomerVisitsList customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
