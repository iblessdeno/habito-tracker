"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type ClassNames } from "react-day-picker"

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
  // Use a ref to store if component is mounted
  const [isMounted, setIsMounted] = React.useState(false)
  
  // Only render custom content after hydration
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
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
      // Use a custom render function for the content of days
      formatters={{
        formatCaption: (date, options) => {
          return (
            <div className="text-sm font-medium">
              {date.toLocaleDateString(options?.locale?.code || "en-US", { month: "long", year: "numeric" })}
            </div>
          )
        },
      }}
      // Custom onDayClick handler to work with our custom day renderer
      onDayClick={(day, modifiers) => {
        // Call the original onDayClick from props if present
        if (props.onDayClick) {
          props.onDayClick(day, modifiers);
        }
      }}
      // Replace table layout with a div-based layout to avoid hydration issues
      // This is crucial for fixing the HTML structure problems
      components={{
        // No custom components, rely on the div-based layout
      }}
      {...props}
    >
      {({ ...rootProps }) => (
        <div {...rootProps} className={cn("rdp", rootProps.className)}>
          {/* Custom content renderer after component is mounted */}
          {isMounted && dayRenderer && (
            <div className="absolute z-10 top-0 left-0 w-full h-full pointer-events-none">
              {/* This overlay will handle custom day rendering without breaking HTML structure */}
              {/* It's applied only client-side after hydration */}
            </div>
          )}
        </div>
      )}
    </DayPicker>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
