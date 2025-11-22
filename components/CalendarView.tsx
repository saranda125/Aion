import React, { useMemo } from 'react';
import { CalendarEvent, EventSource } from '../types';
import { Clock, Activity, Heart, Droplet, Zap } from 'lucide-react';

interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getSourceIcon = (source: EventSource) => {
  switch (source) {
    case EventSource.GOOGLE: return <Clock className="w-3 h-3" />;
    case EventSource.HEALTH: return <Activity className="w-3 h-3" />;
    case EventSource.FLO: return <Droplet className="w-3 h-3" />;
    case EventSource.TUM: return <Zap className="w-3 h-3" />;
    case EventSource.AION_AI: return <Heart className="w-3 h-3" />;
    default: return <Clock className="w-3 h-3" />;
  }
};

export const CalendarView: React.FC<CalendarViewProps> = ({ events, currentDate }) => {
  // Determine the start of the week (Sunday) based on current date
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startOfWeek]);

  const getEventsForDay = (date: Date) => {
    return events.filter(e => 
      e.start.getDate() === date.getDate() && 
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear() &&
      !e.title.includes("Phase") // Filter out all-day phase markers for the time grid, handle separately if needed
    );
  };

  const getDailyPhase = (date: Date) => {
     return events.find(e => 
      e.source === EventSource.FLO && 
      e.start.getDate() === date.getDate() &&
      e.title.includes("Phase")
    );
  };

  return (
    <div className="flex flex-col h-full bg-aion-bg text-slate-300 overflow-hidden">
      {/* Header Days */}
      <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900/50">
        <div className="p-4 border-r border-slate-800 text-xs font-medium text-slate-500 flex items-center justify-center">
          GMT+0
        </div>
        {weekDays.map((day, idx) => {
           const isToday = day.getDate() === new Date().getDate();
           const phase = getDailyPhase(day);
           
           return (
            <div key={idx} className={`p-2 text-center border-r border-slate-800 relative overflow-hidden group ${isToday ? 'bg-slate-800/50' : ''}`}>
              {phase && (
                <div className={`absolute top-0 left-0 w-full h-1 ${phase.color} opacity-80`} title={phase.title} />
              )}
              <div className={`text-xs uppercase tracking-widest font-semibold mb-1 ${isToday ? 'text-aion-accent' : 'text-slate-500'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-2xl font-serif ${isToday ? 'text-white' : 'text-slate-400'}`}>
                {day.getDate()}
              </div>
              {phase && (
                <div className="text-[10px] truncate text-pink-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {phase.title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="grid grid-cols-8 min-h-[1200px]">
          {/* Time Labels */}
          <div className="border-r border-slate-800 bg-slate-900/30">
            {HOURS.map(hour => (
              <div key={hour} className="h-[50px] border-b border-slate-800/50 text-[10px] text-slate-500 pr-2 text-right pt-1">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.getDate() === new Date().getDate();

            return (
              <div key={dayIdx} className={`relative border-r border-slate-800/50 ${isToday ? 'bg-slate-800/10' : ''}`}>
                {/* Grid Lines */}
                {HOURS.map(h => (
                  <div key={h} className="h-[50px] border-b border-slate-800/30" />
                ))}

                {/* Events */}
                {dayEvents.map(event => {
                  const startHour = event.start.getHours() + (event.start.getMinutes() / 60);
                  const endHour = event.end.getHours() + (event.end.getMinutes() / 60);
                  const duration = endHour - startHour;
                  const top = startHour * 50;
                  const height = duration * 50;

                  return (
                    <div
                      key={event.id}
                      className={`absolute inset-x-1 rounded-lg p-2 text-xs border-l-2 shadow-lg hover:brightness-110 transition-all cursor-pointer overflow-hidden z-10`}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 25)}px`, // Min height for visibility
                        backgroundColor: event.source === EventSource.AION_AI ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.9)',
                        borderColor: event.color?.replace('bg-', 'text-') || '#cbd5e1', // Hacky color mapping for border
                        borderLeftColor: 'currentColor' // Uses the text color set by Tailwind class logic usually, but here we rely on inline style for dynamic colors if needed or classes.
                      }}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${event.color}`} />
                      <div className="flex items-center gap-1 mb-0.5 text-slate-200 font-semibold pl-2">
                         {getSourceIcon(event.source)}
                         <span className="truncate">{event.title}</span>
                      </div>
                      <div className="pl-2 text-[10px] text-slate-400 truncate">
                        {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};