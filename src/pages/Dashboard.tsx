
import { useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthentication";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, ArrowUp, ArrowDown, Users, ShoppingCart, Package, Map, TrendingUp } from "lucide-react";

const Dashboard = () => {
  useAuthGuard();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    customerCount: 0,
    averageOrderValue: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      // Mock data - would be replaced with actual API calls
      setStats({
        totalSales: 124580,
        orderCount: 267,
        customerCount: 89,
        averageOrderValue: 466.59,
      });
      
      setSalesData([
        { month: "Jan", sales: 12400 },
        { month: "Feb", sales: 15100 },
        { month: "Mar", sales: 18200 },
        { month: "Apr", sales: 16800 },
        { month: "May", sales: 19500 },
        { month: "Jun", sales: 21000 },
        { month: "Jul", sales: 19800 },
      ]);
      
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const recentOrders = [
    { id: "ORD-2023-789", customer: "Acme Corp", total: 1250, status: "confirmed" },
    { id: "ORD-2023-788", customer: "TechSolutions", total: 3470, status: "delivered" },
    { id: "ORD-2023-787", customer: "GreenGrocer", total: 890, status: "pending" },
    { id: "ORD-2023-786", customer: "City Books", total: 1150, status: "delivered" },
    { id: "ORD-2023-785", customer: "Fresh Foods", total: 2345, status: "confirmed" },
  ];
  
  const upcomingVisits = [
    { id: 1, customer: "Acme Corp", address: "123 Business Ave", time: "9:00 AM" },
    { id: 2, customer: "TechSolutions", address: "456 Innovation St", time: "11:30 AM" },
    { id: 3, customer: "GreenGrocer", address: "789 Fresh Lane", time: "2:00 PM" },
    { id: 4, customer: "City Books", address: "321 Reading Rd", time: "4:15 PM" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-shimmer"></div>
              </CardHeader>
              <CardContent>
                <div className="h-5 w-16 bg-gray-200 rounded animate-shimmer"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className="md:col-span-2 h-64">
            <CardHeader className="pb-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
            </CardHeader>
            <CardContent className="h-full flex items-center justify-center">
              <div className="h-40 w-full bg-gray-100 rounded animate-shimmer"></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
            </CardHeader>
            <CardContent>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b last:border-0">
                  <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={`$${stats.totalSales.toLocaleString()}`}
          description="This month"
          trend="up"
          trendValue="12.5%"
          icon={<Activity className="h-4 w-4" />}
        />
        
        <StatCard
          title="Orders"
          value={stats.orderCount.toString()}
          description="Total orders"
          trend="up"
          trendValue="8.2%"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        
        <StatCard
          title="Customers"
          value={stats.customerCount.toString()}
          description="Active accounts"
          trend="up"
          trendValue="4.1%"
          icon={<Users className="h-4 w-4" />}
        />
        
        <StatCard
          title="Avg. Order"
          value={`$${stats.averageOrderValue.toLocaleString()}`}
          description="Per transaction"
          trend="down"
          trendValue="1.8%"
          icon={<Package className="h-4 w-4" />}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Sales"]}
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem"
                    }}
                  />
                  <Bar dataKey="sales" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              <span>Today's Route</span>
            </CardTitle>
            <CardDescription>Upcoming customer visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingVisits.map((visit) => (
                <div key={visit.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sales-100 text-sales-700">
                    {visit.time}
                  </div>
                  <div>
                    <div className="font-medium">{visit.customer}</div>
                    <div className="text-sm text-muted-foreground">{visit.address}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Orders</span>
          </CardTitle>
          <CardDescription>Latest customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Order ID</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm">{order.id}</td>
                    <td className="p-3 text-sm">{order.customer}</td>
                    <td className="p-3 text-sm">${order.total.toLocaleString()}</td>
                    <td className="p-3 text-sm">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ 
  title, 
  value, 
  description, 
  trend, 
  trendValue, 
  icon 
}: { 
  title: string;
  value: string;
  description: string;
  trend: "up" | "down";
  trendValue: string;
  icon: React.ReactNode;
}) => {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="rounded-full bg-gray-100 p-1">{icon}</div>
        </div>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1">
          {trend === "up" ? (
            <div className="flex items-center text-emerald-500">
              <ArrowUp className="h-3 w-3" />
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          ) : (
            <div className="flex items-center text-rose-500">
              <ArrowDown className="h-3 w-3" />
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const OrderStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default Dashboard;
