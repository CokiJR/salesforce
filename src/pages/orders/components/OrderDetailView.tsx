
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Order, OrderItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Edit, Printer, User, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderDetailViewProps {
  order: Order | null;
  isLoading: boolean;
}

export function OrderDetailView({ order, isLoading }: OrderDetailViewProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (order && order.sync_status !== "synced") {
      navigate(`/dashboard/orders/edit/${order.id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot edit",
        description: "This order has already been synced and cannot be edited",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Order Selected</CardTitle>
          <CardDescription>
            Select an order from the list to view its details
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/orders")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
        </div>
        <div className="flex gap-2">
          {order.sync_status !== "synced" && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
              <CardDescription>
                Created on {format(new Date(order.created_at), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
              <Badge className={getPaymentStatusColor(order.payment_status)}>
                {order.payment_status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="font-medium">{order.customer?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer?.address}, {order.customer?.city}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {order.customer?.contact_person} • {order.customer?.phone}
                </p>
                {order.customer?.email && (
                  <p className="text-sm text-muted-foreground">
                    {order.customer.email}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Order Date:</span>
                    <span>{format(new Date(order.order_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Date:</span>
                    <span>{format(new Date(order.delivery_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Order Items</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: OrderItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>{item.quantity} {item.product.unit}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(order.total_amount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <p className="text-muted-foreground">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div className="flex gap-2">
            {order.payment_status !== "paid" && (
              <Button onClick={() => navigate(`/dashboard/transactions/add?order=${order.id}`)}>
                Record Payment
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
