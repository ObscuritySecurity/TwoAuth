
'use client';

import { useContext, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';

import { Button } from '@/components/ui/button';
import { AppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';

interface FakeCalendarProps {
  onTriggerPin: () => void;
}

export function FakeCalendar({ onTriggerPin }: FakeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const context = useContext(AppContext);

  if (!context) return null;
  const { t } = context;

  const renderHeader = () => {
    return (
      <header className="flex items-center justify-between border-b p-4">
        <Button variant="ghost" size="icon" onClick={onTriggerPin}>
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft />
            </Button>
            <h1 className="font-headline text-xl font-bold w-32 text-center">
                {format(currentMonth, 'MMMM yyyy')}
            </h1>
             <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight />
            </Button>
        </div>
        <div className="w-10"></div>
      </header>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 text-center text-sm text-muted-foreground">
        {days.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 text-center">
        {days.map(day => (
          <div
            key={day.toString()}
            className={cn(
              "p-2 h-12 flex items-center justify-center",
              !isSameMonth(day, monthStart) && "text-muted-foreground/50"
            )}
          >
            <span
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full",
                isToday(day) && "bg-primary text-primary-foreground"
              )}
            >
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="flex h-full flex-col bg-background">
      {renderHeader()}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderDays()}
        {renderCells()}
      </main>
    </div>
  );
}
