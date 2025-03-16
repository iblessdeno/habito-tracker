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

  // We need a safer approach to rendering days
  // Instead of trying to override the Day component, we'll use the renderDay prop
  // This allows us to keep the original Day component's structure
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
      components={{
        // No custom components - let DayPicker handle the rendering with its default structure
      }}
      modifiersClassNames={{
        selected: "bg-primary text-primary-foreground",
        today: "bg-accent text-accent-foreground",
      }}
      // Use the footer slot to render custom day content after hydration
      footer={isMounted && dayRenderer ? <CustomDayContent dayRenderer={dayRenderer} /> : undefined}
      {...props}
    />
  )
}

// This component doesn't modify the calendar's HTML structure
// It just adds custom content via JavaScript after hydration
function CustomDayContent({ dayRenderer }: { dayRenderer: (day: Date) => React.ReactNode }) {
  React.useEffect(() => {
    // This safely adds custom content to day cells after the calendar has been hydrated
    try {
      // Get all day cells
      const dayCells = document.querySelectorAll(".rdp-day");
      
      dayCells.forEach(dayCell => {
        const dateAttr = dayCell.getAttribute("data-day");
        if (!dateAttr) return;
        
        const date = new Date(dateAttr);
        if (!isValid(date)) return;
        
        // Create a container for the custom content
        const customContentContainer = document.createElement("div");
        customContentContainer.className = "custom-day-content absolute bottom-1 left-0 right-0 flex justify-center";
        
        // Render the custom content into a temporary element
        const tempEl = document.createElement("div");
        
        // Use ReactDOM to render the custom content
        const ReactDOM = require("react-dom");
        ReactDOM.render(dayRenderer(date), tempEl);
        
        // Extract just the custom indicator (if it exists)
        const customIndicator = tempEl.querySelector(".absolute.bottom-1");
        if (customIndicator) {
          customContentContainer.appendChild(customIndicator);
          dayCell.appendChild(customContentContainer);
        }
      });
    } catch (error) {
      console.error("Error adding custom day content:", error);
    }
    
    // Clean up on unmount
    return () => {
      const customContents = document.querySelectorAll(".custom-day-content");
      customContents.forEach(el => el.remove());
    };
  }, [dayRenderer]);
  
  return null;
}

Calendar.displayName = "Calendar"

export { Calendar }
