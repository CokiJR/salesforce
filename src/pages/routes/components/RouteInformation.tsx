
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DailyRoute } from "@/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RouteInformationProps {
  route: DailyRoute;
}

export const RouteInformation = ({ route }: RouteInformationProps) => {
  const routeDate = new Date(route.date);
  const weekStart = startOfWeek(routeDate, { weekStartsOn: 1 }); // Monday as start of week
  const weekEnd = endOfWeek(routeDate, { weekStartsOn: 1 }); // Sunday as end of week
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Route Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Route ID</p>
            <p>{route.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Week Period</p>
            <p>{format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}</p>
          </div>
        </div>

        <Separator className="my-6" />
      </CardContent>
    </Card>
  );
};
