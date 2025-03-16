'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from '@/components/ui/pagination';

interface HabitHistoryProps {
  habitLogs: Array<{
    id: number;
    completed_at: string;
    notes?: string;
  }>;
  color?: string;
}

export function HabitHistory({ habitLogs, color = '#4f46e5' }: HabitHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;
  
  // Sort logs by date (newest first)
  const sortedLogs = [...habitLogs].sort((a, b) => 
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = sortedLogs.slice(indexOfFirstLog, indexOfLastLog);
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, 'MMMM d, yyyy'),
      time: format(date, 'h:mm a')
    };
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Completion History</CardTitle>
      </CardHeader>
      <CardContent>
        {currentLogs.length > 0 ? (
          <div className="space-y-4">
            {currentLogs.map((log) => {
              const { date, time } = formatDateTime(log.completed_at);
              
              return (
                <div 
                  key={log.id} 
                  className="border rounded-md p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{time}</span>
                      </div>
                    </div>
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: color }}
                    ></div>
                  </div>
                  
                  {log.notes && (
                    <div className="mt-2 text-sm border-t pt-2">
                      {log.notes}
                    </div>
                  )}
                </div>
              );
            })}
            
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }} 
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          href="#" 
                          isActive={pageNum === currentPage}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }} 
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No completion history yet.</p>
            <p className="text-sm mt-1">Complete this habit to start tracking your progress.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
