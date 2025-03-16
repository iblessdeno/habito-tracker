"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format, isValid } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  dayRenderer?: (day: Date) => React.ReactNode
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  dayRenderer,
  ...props
}: CalendarProps) {
  // Use client-side only rendering for custom day content
  const [isMounted, setIsMounted] = React.useState(false)
  
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // We need to completely override the rendering to fix the HTML structure
  return (
    <div className={cn("p-3", className)}>
      {/* A custom implementation of the calendar that doesn't attempt to override the DayPicker in ways that break HTML structure */}
      {/* Instead, we'll render a completely separate custom calendar for custom day rendering */}
      {isMounted && dayRenderer ? (
        <CustomCalendar 
          dayRenderer={dayRenderer}
          selectedDay={props.mode === "single" && props.selected instanceof Date ? props.selected : new Date()}
          onDaySelect={(date) => {
            if (props.mode === "single" && typeof props.onSelect === "function") {
              props.onSelect(date, date, { selected: true, disabled: false, today: date.toDateString() === new Date().toDateString() }, undefined as any);
            }
          }}
        />
      ) : (
        <DayPicker
          showOutsideDays={showOutsideDays}
          className={cn("p-3", className)}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            ...classNames,
          }}
          {...props}
        />
      )}
    </div>
  )
}

// Custom calendar implementation that ensures proper HTML structure
function CustomCalendar({ 
  dayRenderer, 
  selectedDay, 
  onDaySelect 
}: { 
  dayRenderer: (date: Date) => React.ReactNode;
  selectedDay: Date;
  onDaySelect?: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = React.useState(
    new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1)
  );
  
  // Get the days of the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  // Get day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const days = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  
  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Handle day selection
  const handleDayClick = (date: Date) => {
    if (onDaySelect) {
      onDaySelect(date);
    }
  };
  
  // Check if a date is the selected date
  const isSelectedDate = (date: Date) => {
    return selectedDay && date.getDate() === selectedDay.getDate() && 
      date.getMonth() === selectedDay.getMonth() && 
      date.getFullYear() === selectedDay.getFullYear();
  };
  
  return (
    <div className="calendar">
      {/* Calendar header */}
      <div className="flex justify-center pt-1 relative items-center">
        <button 
          onClick={prevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button 
          onClick={nextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Calendar body - using proper HTML table structure */}
      <table className="w-full border-collapse space-y-1 mt-4">
        <thead>
          <tr className="flex w-full">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <th key={i} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Create weeks */}
          {Array.from({ length: Math.ceil((days.length + firstDayOfMonth) / 7) }).map((_, weekIndex) => (
            <tr key={weekIndex} className="flex w-full mt-2">
              {/* Create days in the week */}
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayNumber = weekIndex * 7 + dayIndex - firstDayOfMonth + 1;
                const date = dayNumber > 0 && dayNumber <= days.length 
                  ? days[dayNumber - 1] 
                  : null;
                
                return (
                  <td 
                    key={dayIndex}
                    className="h-9 w-9 text-center text-sm p-0 relative"
                  >
                    {date ? (
                      <button 
                        type="button"
                        onClick={() => handleDayClick(date)}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "h-9 w-9 p-0 font-normal",
                          isSelectedDate(date) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        )}
                      >
                        <div className="h-full w-full flex items-center justify-center">
                          {dayRenderer(date)}
                        </div>
                      </button>
                    ) : (
                      <div className="h-9 w-9"></div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Calendar.displayName = "Calendar"

export { Calendar }
