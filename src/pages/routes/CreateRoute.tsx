import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { useAuthentication } from "@/hooks/useAuthentication";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar as CalendarIcon, Loader2, MapPin, Plus, Trash2 } from "lucide-react";

// Route form schema
const routeSchema = z.object({
  date: z.date(),
});

// Stop schema
const stopSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  visit_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be a valid time (HH:MM)"),
  notes: z.string().optional(),
});

type RouteFormValues = z.infer<typeof routeSchema>;
type StopFormValues = z.infer<typeof stopSchema>;

export default function CreateRoute() {
  const { user } = useAuthentication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stops, setStops] = useState<Array<StopFormValues & { customer: Customer }>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [visitTime, setVisitTime] = useState<string>("09:00");
  const [notes, setNotes] = useState<string>("");
  const [loadingItems, setLoadingItems] = useState(true);
  const navigate = useNavigate();

  // Initialize the form
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingItems(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("status", "active")
          .order("name");
        
        if (error) throw error;
        
        // Convert the raw data to properly typed Customer objects
        const typedCustomers: Customer[] = data?.map(customer => ({
          id: customer.id,
          name: customer.name,
          address: customer.address,
          city: customer.city,
          phone: customer.phone,
          email: customer.email || "",
          contact_person: customer.contact_person,
          status: customer.status as "active" | "inactive",
          created_at: customer.created_at,
          location: customer.location ? {
            lat: Number((customer.location as any).lat || 0),
            lng: Number((customer.location as any).lng || 0)
          } : undefined
        })) || [];
        
        setCustomers(typedCustomers);
      } catch (error: any) {
        console.error("Error fetching customers:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load customers: ${error.message}`,
        });
      } finally {
        setLoadingItems(false);
      }
    };

    fetchCustomers();
  }, []);

  // Handle adding a stop to the route
  const handleAddStop = () => {
    if (!selectedCustomer || !visitTime) return;
    
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return;
    
    // Check if customer is already in the stops list
    if (stops.some(stop => stop.customer_id === selectedCustomer)) {
      toast({
        variant: "destructive",
        title: "Duplicate customer",
        description: "This customer is already added to the route.",
      });
      return;
    }
    
    const newStop = {
      customer_id: customer.id,
      customer: customer,
      visit_time: visitTime,
      notes: notes
    };
    
    setStops([...stops, newStop]);
    setSelectedCustomer("");
    setVisitTime("09:00");
    setNotes("");
  };

  // Handle removing a stop from the route
  const handleRemoveStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };

  // Handle form submission
  const onSubmit = async (data: RouteFormValues) => {
    if (stops.length === 0) {
      toast({
        variant: "destructive",
        title: "No stops added",
        description: "Please add at least one customer stop to the route.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create route object
      const routeData = {
        date: format(data.date, "yyyy-MM-dd"),
        salesperson_id: user?.id,
      };
      
      // Insert route
      const { data: newRoute, error: routeError } = await supabase
        .from("daily_routes")
        .insert(routeData)
        .select("*")
        .single();
      
      if (routeError) throw routeError;
      
      // Insert route stops
      const routeStopsData = stops.map(stop => ({
        route_id: newRoute.id,
        customer_id: stop.customer_id,
        visit_date: format(data.date, "yyyy-MM-dd"),
        visit_time: stop.visit_time,
        status: "pending",
        notes: stop.notes || ""
      }));
      
      const { error: stopsError } = await supabase
        .from("route_stops")
        .insert(routeStopsData);
      
      if (stopsError) throw stopsError;
      
      toast({
        title: "Route created",
        description: `Route for ${format(data.date, "MMMM d, yyyy")} has been created successfully.`,
      });
      
      navigate("/dashboard/routes");
    } catch (error: any) {
      console.error("Error creating route:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create route: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort stops by visit time
  const sortedStops = [...stops].sort((a, b) => {
    return a.visit_time.localeCompare(b.visit_time);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/routes")}
            className="rounded-full"
            aria-label="Back to routes"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create Route</h1>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Route Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer Stops</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Input
                      type="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      placeholder="Visit time"
                    />
                  </div>
                  
                  <div>
                    <Button 
                      type="button" 
                      onClick={handleAddStop}
                      className="w-full"
                      variant="secondary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stop
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Textarea
                    placeholder="Notes for this stop (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                
                {sortedStops.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedStops.map((stop, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{stop.visit_time}</TableCell>
                            <TableCell>{stop.customer.name}</TableCell>
                            <TableCell>
                              {stop.customer.address}, {stop.customer.city}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {stop.notes || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveStop(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No stops added to this route yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the form above to add customer stops</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/routes")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || stops.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Route</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="md:col-span-1">
          <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center sticky top-6">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Route Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a route by adding customer stops in the order they should be visited.
            </p>
            <div className="w-full space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Stops:</span>
                <span className="font-medium">{stops.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selected Date:</span>
                <span className="font-medium">
                  {form.watch('date') ? format(form.watch('date'), 'MMM d, yyyy') : 'Not selected'}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Schedule customer visits efficiently by planning your route in advance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

