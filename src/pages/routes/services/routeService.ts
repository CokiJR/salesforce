
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { format } from "date-fns";
import { shouldVisitThisWeek } from "@/utils/routeScheduler";

// Create an automated route based on customer visit cycles
export async function createAutomatedRoute(
  date: Date, 
  salespersonId: string, 
  eligibleCustomers: Customer[]
) {
  // Step 1: Create the route record
  const { data: newRoute, error: routeError } = await supabase
    .from("daily_routes")
    .insert({
      date: format(date, "yyyy-MM-dd"),
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
  
  // Base time for first visit (9:00 AM)
  const baseHour = 9;
  const visitDurationMinutes = 30;
  
  // Create route stops with incremental visit times
  const routeStopsData = sortedCustomers.map((customer, index) => {
    // Calculate visit time (30 min intervals starting at 9:00 AM)
    const totalMinutes = baseHour * 60 + index * visitDurationMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return {
      route_id: newRoute.id,
      customer_id: customer.id,
      visit_date: format(date, "yyyy-MM-dd"),
      visit_time: formattedTime,
      status: "pending",
      notes: `Auto-scheduled visit (${customer.cycle} cycle)`
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
