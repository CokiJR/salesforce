
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "sales";
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  contact_person: string;
  status: "active" | "inactive";
  created_at: string;
  location?: { lat: number; lng: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  category: string;
  unit: string;
  stock: number;
  image_url?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer: Customer;
  salesperson_id: string;
  status: "draft" | "pending" | "confirmed" | "delivered" | "canceled";
  order_date: string;
  delivery_date: string;
  total_amount: number;
  payment_status: "unpaid" | "partial" | "paid";
  notes: string;
  items: OrderItem[];
  created_at: string;
}

export interface RouteStop {
  id: string;
  customer_id: string;
  customer: Customer;
  visit_date: string;
  visit_time: string;
  status: "pending" | "completed" | "skipped";
  notes: string;
}

export interface DailyRoute {
  id: string;
  salesperson_id: string;
  date: string;
  stops: RouteStop[];
  created_at: string;
}

export interface SyncStatus {
  last_sync: string;
  pending_uploads: number;
  pending_downloads: number;
}
