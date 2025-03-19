
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { format, startOfWeek } from "date-fns";
import { shouldVisitThisWeek } from "@/utils/routeScheduler";

// Create an automated route based on customer visit cycles for the entire week
export async function createAutomatedRoute(
  date: Date, 
  salespersonId: string, 
  eligibleCustomers: Customer[]
) {
  // Normalize to start of week to ensure consistency
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  
  // Step 1: Create the weekly route record
  const { data: newRoute, error: routeError } = await supabase
    .from("daily_routes")
    .insert({
      date: format(weekStart, "yyyy-MM-dd"),
      salesperson_id: salespersonId,
    })
    .select("*")
    .single();
  
  if (routeError) throw routeError;
  
  // Step 2: Create route stops for eligible customers
  // Sort customers by name for a consistent order
  const sortedCustomers = [...eligibleCustomers].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  // For weekly routes, we spread customers throughout the week
  // Each customer is initially added with no specific visit time
  // Visit date and time will be set automatically when the visit happens
  const routeStopsData = sortedCustomers.map((customer) => {
    return {
      route_id: newRoute.id,
      customer_id: customer.id,
      visit_date: null, // Will be set when the outlet is visited or skipped
      visit_time: null, // Will be set when the outlet is visited or skipped
      status: "pending",
      notes: `Scheduled for weekly visit (${customer.cycle} cycle)`
    };
  });
  
  if (routeStopsData.length > 0) {
    const { error: stopsError } = await supabase
      .from("route_stops")
      .insert(routeStopsData);
    
    if (stopsError) throw stopsError;
  }
  
  return newRoute;
}
