"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Check } from "lucide-react";
import { format, isSameDay } from "date-fns";

type CompletionDay = {
  date: Date;
  completed: boolean;
};

interface CalendarWithIndicatorsProps {
  completions: CompletionDay[];
  selectedDate: Date;
  onSelectDate: (date: Date | undefined) => void;
  indicatorColor?: string;
}

export function CalendarWithIndicators({
  completions,
  selectedDate,
  onSelectDate,
  indicatorColor = "var(--primary)"
}: CalendarWithIndicatorsProps) {
  const [mounted, setMounted] = useState(false);

  // Effect to add completion indicators after hydration
  useEffect(() => {
    setMounted(true);

    if (mounted && completions.length > 0) {
      // Clear any existing indicators first
      document.querySelectorAll(".completion-indicator").forEach(el => el.remove());
      
      // Find all day cells
      const dayCells = document.querySelectorAll("button.rdp-day");
      
      dayCells.forEach(dayCell => {
        // Get the date from the day cell
        const dateAttr = dayCell.getAttribute("data-day");
        if (!dateAttr) return;
        
        const date = new Date(dateAttr);
        
        // Check if this date has a completion
        const isCompleted = completions.some(day => 
          day.completed && isSameDay(day.date, date)
        );
        
        if (isCompleted) {
          // Create and add an indicator
          const indicator = document.createElement("div");
          indicator.className = "completion-indicator absolute bottom-1 w-4 h-4 rounded-full flex items-center justify-center";
          indicator.style.backgroundColor = indicatorColor;
          
          // Add a checkmark inside
          const checkmark = document.createElement("div");
          checkmark.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          checkmark.className = "text-white";
          
          indicator.appendChild(checkmark);
          dayCell.appendChild(indicator);
        }
      });
    }
    
    // Cleanup on unmount
    return () => {
      document.querySelectorAll(".completion-indicator").forEach(el => el.remove());
    };
  }, [mounted, completions, indicatorColor]);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onSelectDate}
      className="rounded-md border"
    />
  );
}
