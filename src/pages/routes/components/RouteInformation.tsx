
import { format } from "date-fns";
import { DailyRoute } from "@/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RouteInformationProps {
  route: DailyRoute;
}

export const RouteInformation = ({ route }: RouteInformationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Route ID</p>
            <p>{route.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date</p>
            <p>{format(new Date(route.date), "EEEE, MMMM d, yyyy")}</p>
          </div>
        </div>

        <Separator className="my-6" />
      </CardContent>
    </Card>
  );
};
