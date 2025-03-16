'use client';

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { HabitTemplate } from "@/types/habit-types";

// Define habit templates based on bullet journal ideas
export const habitTemplates: HabitTemplate[] = [
  // Health & Wellness Category
  {
    title: "Daily Exercise",
    description: "Stay active with regular exercise",
    frequency: "daily",
    target_count: 1,
    color: "var(--exercise)",
    icon: "🏃",
    category: "Health & Wellness"
  },
  {
    title: "Drink Water",
    description: "Drink enough water each day",
    frequency: "daily",
    target_count: 8,
    color: "var(--water)",
    icon: "💧",
    category: "Health & Wellness"
  },
  {
    title: "Meditation",
    description: "Practice mindfulness meditation",
    frequency: "daily",
    target_count: 1,
    color: "var(--meditate)",
    icon: "🧘",
    category: "Health & Wellness"
  },
  {
    title: "Take Vitamins",
    description: "Remember to take your vitamins & medication",
    frequency: "daily",
    target_count: 1,
    color: "var(--health)",
    icon: "💊",
    category: "Health & Wellness"
  },
  
  // Personal Care Category
  {
    title: "Skincare Routine",
    description: "Complete your skincare routine",
    frequency: "daily",
    target_count: 1,
    color: "var(--self-care)",
    icon: "✨",
    category: "Personal Care"
  },
  {
    title: "Oral Care",
    description: "Brush, floss, and use mouthwash",
    frequency: "daily",
    target_count: 2,
    color: "var(--self-care)",
    icon: "🪥",
    category: "Personal Care"
  },
  
  // Productivity Category
  {
    title: "Read",
    description: "Read for at least 30 minutes",
    frequency: "daily",
    target_count: 1,
    color: "var(--read)",
    icon: "📚",
    category: "Productivity"
  },
  {
    title: "Journal",
    description: "Write in your journal",
    frequency: "daily",
    target_count: 1,
    color: "var(--journal)",
    icon: "📝",
    category: "Productivity"
  },
  {
    title: "Study Session",
    description: "Dedicated time for studying",
    frequency: "daily",
    target_count: 1,
    color: "var(--study)",
    icon: "💡",
    category: "Productivity"
  },
  
  // Digital Wellbeing Category
  {
    title: "Limit Social Media",
    description: "Reduce time spent on social media",
    frequency: "daily",
    target_count: 1,
    color: "var(--digital)",
    icon: "📱",
    category: "Digital Wellbeing"
  },
  
  // Daily Routines Category
  {
    title: "Make Bed",
    description: "Make your bed in the morning",
    frequency: "daily",
    target_count: 1,
    color: "var(--home)",
    icon: "🛏️",
    category: "Daily Routines"
  },
  {
    title: "Cook Meal",
    description: "Cook a healthy meal at home",
    frequency: "daily",
    target_count: 1,
    color: "var(--cook)",
    icon: "🍳",
    category: "Daily Routines"
  },
  
  // Weekly Habits
  {
    title: "Cleaning",
    description: "Complete weekly cleaning tasks",
    frequency: "weekly",
    target_count: 1,
    color: "var(--home)",
    icon: "🧹",
    category: "Daily Routines"
  },
  {
    title: "Outdoor Time",
    description: "Spend time outdoors in nature",
    frequency: "weekly",
    target_count: 3,
    color: "var(--walk)",
    icon: "🌲",
    category: "Health & Wellness"
  },
  
  // Monthly Habits
  {
    title: "Learn New Skill",
    description: "Dedicate time to learning something new",
    frequency: "monthly",
    target_count: 4,
    color: "var(--study)",
    icon: "🔍",
    category: "Self-improvement"
  },
  {
    title: "Date Night",
    description: "Schedule a date night",
    frequency: "monthly",
    target_count: 1,
    color: "var(--social)",
    icon: "❤️",
    category: "Social"
  }
];

// Group templates by category
const groupedTemplates = habitTemplates.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category].push(template);
  return acc;
}, {} as Record<string, HabitTemplate[]>);

interface HabitTemplatesProps {
  onSelectTemplate: (template: HabitTemplate) => void;
}

export function HabitTemplates({ onSelectTemplate }: HabitTemplatesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Habit Templates</h2>
      </div>
      
      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
          <ScrollArea className="whitespace-nowrap pb-2">
            <div className="flex space-x-4">
              {templates.map((template, i) => (
                <Card key={i} className="w-[200px] shrink-0">
                  <CardHeader className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{template.icon}</span>
                      <CardTitle className="text-sm">{template.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <CardDescription className="text-xs line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="p-3 pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => onSelectTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
