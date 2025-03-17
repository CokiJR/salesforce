
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getCurrentWeekOfMonth } from "@/utils/routeScheduler";

interface RouteCalendarProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function RouteCalendar({ date, setDate }: RouteCalendarProps) {
  const currentWeek = getCurrentWeekOfMonth();
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && setDate(date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium">
        Week {currentWeek} of the month
      </div>
    </div>
  );
}
