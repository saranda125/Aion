

import React, { useMemo, useState } from 'react';
import { CalendarEvent, EventSource } from '../types';
import { Clock, Activity, Heart, Droplet, Zap, ChevronLeft, ChevronRight, Plus, X, Sparkles, Calendar as CalendarIcon, AlertCircle, GraduationCap, CheckCircle, MapPin } from 'lucide-react';
import { getActivityIcon } from './DashboardViews';

interface CalendarViewProps {
  events: CalendarEvent[];
  suggestedEvents: CalendarEvent[];
  currentDate: Date;
  onAddEvent: (event: CalendarEvent) => void;
  onAcceptSuggestion: (suggestion: CalendarEvent) => void;
  isGoogleConnected?: boolean;
  isTUMConnected?: boolean;
  isFloConnected?: boolean;
  hasCompletedCheckin: boolean;
}

type ViewMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getSourceIcon = (event: CalendarEvent) => {
  if (event.source === EventSource.HEALTH && event.workoutType) {
      return getActivityIcon(event.workoutType);
  }
  switch (event.source) {
    case EventSource.GOOGLE: return <CalendarIcon className="w-3 h-3" />;
    case EventSource.HEALTH: return <Activity className="w-3 h-3" />;
    case EventSource.FLO: return <Droplet className="w-3 h-3" />;
    case EventSource.TUM: return <GraduationCap className="w-3 h-3" />;
    case EventSource.AION_AI: return <Sparkles className="w-3 h-3" />;
    case EventSource.SCHOOL: return <GraduationCap className="w-3 h-3" />;
    default: return <Clock className="w-3 h-3" />;
  }
};

// Updated Color Logic as per requirements
const getSourceColor = (event: CalendarEvent) => {
    // Missed Workouts (Red Faded)
    if (event.status === 'missed') {
        return 'bg-red-50 border-red-200 text-red-400 border-dashed';
    }
    
    // Planned Workouts (Dashed Red)
    if (event.status === 'planned' && event.source === EventSource.HEALTH) {
        return 'bg-red-50 border-dashed border-red-300 text-red-600';
    }

    // Standard Event Colors
    switch (event.source) {
        case EventSource.GOOGLE: 
            // Google = Orange
            return 'bg-orange-500 border-orange-600 text-white';
            
        case EventSource.TUM: 
            // TUM = Blue
            return 'bg-blue-600 border-blue-700 text-white';
            
        case EventSource.FLO: 
            // Flo = Light Pink (Now handled separately in header mostly, but good fallback)
            return 'bg-pink-200 border-pink-300 text-pink-800';
            
        case EventSource.HEALTH: 
            // Workouts = Red (Completed)
            return 'bg-red-500 border-red-600 text-white';
            
        case EventSource.AION_AI: 
            // AI Suggestions = Violet/Purple
            return 'bg-violet-500 border-violet-600 text-white';
            
        case EventSource.SOCIAL: 
            return 'bg-amber-400 border-amber-500 text-amber-900';
            
        default: 
            return 'bg-slate-500 border-slate-600 text-white';
    }
}

const getSourceLabel = (source: EventSource) => {
    switch(source) {
        case EventSource.GOOGLE: return 'G-Cal';
        case EventSource.TUM: return 'TUM';
        case EventSource.AION_AI: return 'Aion Plan';
        case EventSource.FLO: return 'Flo';
        default: return source;
    }
}

const Legend = ({ isGoogle, isTUM, isFlo }: { isGoogle: boolean, isTUM: boolean, isFlo: boolean }) => (
    <div className="flex flex-wrap items-center gap-4 px-6 py-2 bg-white border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {isTUM && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>TUM / University</span>
            </div>
        )}
        {isGoogle && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Google Calendar</span>
            </div>
        )}
        {isFlo && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
                <span className="w-4 h-1.5 rounded-sm bg-pink-200"></span>
                <span>Flo (Cycle)</span>
            </div>
        )}
        {/* Workout is always shown */}
        <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Workout</span>
        </div>
    </div>
);

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  events, 
  suggestedEvents,
  currentDate: initialDate, 
  onAddEvent,
  onAcceptSuggestion,
  isGoogleConnected = false,
  isTUMConnected = false,
  isFloConnected = false,
  hasCompletedCheckin
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Add Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDuration, setNewEventDuration] = useState(60);
  const [newEventCategory, setNewEventCategory] = useState(EventSource.SOCIAL);
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [activeSuggestion, setActiveSuggestion] = useState<CalendarEvent | null>(null);

  // --- NAVIGATION HELPERS ---
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startOfWeek]);

  const navigate = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      if (viewMode === 'day') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
      if (viewMode === 'week') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
      if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
      setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // --- EVENT FILTERING ---
  // Filter out Flo events from the grid, they are handled separately in headers
  const getEventsForDay = (date: Date) => {
    return events.filter(e => 
      e.source !== EventSource.FLO && // Exclude Flo from main grid
      e.start.getDate() === date.getDate() && 
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    );
  };

  // Helper to check for Flo Events specifically
  const isFloDay = (date: Date) => {
      return events.some(e => 
          e.source === EventSource.FLO && 
          date >= e.start && date <= e.end
      );
  };

  const openEditModalForSuggestion = (evt: CalendarEvent) => {
    setNewEventTitle(evt.title);
    setNewEventCategory(evt.source);
    
    const diff = (evt.end.getTime() - evt.start.getTime()) / 1000 / 60;
    setNewEventDuration(Math.round(diff));
    
    const hours = evt.start.getHours().toString().padStart(2, '0');
    const mins = evt.start.getMinutes().toString().padStart(2, '0');
    setNewEventTime(`${hours}:${mins}`);
    
    setActiveSuggestion(evt);
    setIsModalOpen(true);
  };

  const handleCreateEvent = () => {
      if(!newEventTitle) return;

      // Parse time input
      const [hours, mins] = newEventTime.split(':').map(Number);
      const start = new Date(currentDate);
      start.setHours(hours, mins, 0, 0);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + newEventDuration);

      const newEvent: CalendarEvent = {
          id: activeSuggestion ? activeSuggestion.id : `user-${Date.now()}`,
          title: newEventTitle,
          start,
          end,
          source: newEventCategory,
          isFixed: true,
          description: activeSuggestion ? 'Added from suggestions' : 'Added by you',
          status: 'planned'
      };

      if (activeSuggestion) {
          onAcceptSuggestion(newEvent);
      } else {
          onAddEvent(newEvent);
      }

      setIsModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventDuration(60);
    setNewEventCategory(EventSource.SOCIAL);
    setNewEventTime('09:00');
    setActiveSuggestion(null);
  };

  const openNewEventModal = () => {
      resetForm();
      setIsModalOpen(true);
  }

  // --- SUB-VIEWS ---
  
  const renderTimeGrid = (daysToShow: Date[]) => (
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-white">
        <div className={`grid min-h-[1200px] ${daysToShow.length === 1 ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_repeat(7,1fr)]'}`}>
          {/* Time Labels */}
          <div className="border-r border-slate-100 bg-slate-50 text-right pr-2 pt-2 sticky left-0 z-20">
            {HOURS.map(hour => (
              <div key={hour} className="h-[50px] text-[10px] text-slate-400 font-medium -mt-2">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {daysToShow.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();

            return (
              <div key={dayIdx} className={`relative border-r border-slate-100 ${isToday ? 'bg-emerald-50/20' : ''}`}>
                 {/* Grid Lines */}
                 {HOURS.map(h => (
                  <div key={h} className="h-[50px] border-b border-slate-100" />
                ))}

                {/* Events */}
                {dayEvents.map(event => {
                  // Render logic for events
                  const startHour = event.start.getHours() + (event.start.getMinutes() / 60);
                  let endHour = event.end.getHours() + (event.end.getMinutes() / 60);
                  
                  // Handle multi-day display (simplified for day view - clamp to 24h)
                  if (event.end.getDate() !== event.start.getDate()) {
                      endHour = 24;
                  }

                  const duration = endHour - startHour;
                  const top = startHour * 50;
                  const height = duration * 50;
                  
                  // Visual Handling for Status
                  const styleClass = event.color ? `${event.color} text-white` : getSourceColor(event);
                  const isShort = duration <= 0.75;
                  const isMissed = event.status === 'missed';

                  return (
                    <div
                      key={event.id}
                      className={`absolute inset-x-1 z-10 hover:z-50 group`}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 35)}px`,
                      }}
                    >
                      <div className={`h-full w-full overflow-hidden rounded-lg p-2 text-xs shadow-sm hover:shadow-md hover:brightness-110 transition-all cursor-pointer border-l-4 ${styleClass} ${isMissed ? 'opacity-60 line-through' : ''}`}>
                          <div className="relative z-10 h-full flex flex-col justify-center">
                            <div className="flex items-center gap-1 font-bold mb-0.5 leading-none">
                                {getSourceIcon(event)}
                                <span className="truncate">{event.title}</span>
                            </div>
                            {!isShort && (
                                <div className="text-[9px] opacity-80 flex items-center justify-between mt-0.5">
                                    <span>{event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span className="uppercase tracking-tighter text-[8px] opacity-70">{getSourceLabel(event.source)}</span>
                                </div>
                            )}
                          </div>
                      </div>

                      {/* HOVER TOOLTIP */}
                      <div className="hidden group-hover:block absolute left-[95%] top-0 ml-1 z-50 w-48 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none animate-in fade-in zoom-in duration-200">
                          <div className="font-bold mb-1">{event.title}</div>
                          {event.location && (
                              <div className="text-slate-300 mb-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {event.location}
                              </div>
                          )}
                          <div className="text-slate-400 mb-1">
                              {event.start.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} - {event.end.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                          </div>
                          {event.source === EventSource.HEALTH && event.status && (
                              <div className={`font-bold mt-1 uppercase text-[10px] ${event.status === 'completed' ? 'text-emerald-400' : event.status === 'missed' ? 'text-red-400' : 'text-slate-400'}`}>
                                  Status: {event.status}
                              </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
  );

  const renderMonthView = () => {
      // Logic to start from Monday
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      const dayOfWeek = monthStart.getDay(); // Sunday - Saturday : 0 - 6
      // Calculate offset to make Monday the start
      // Mon (1) -> 0 offset
      // Tue (2) -> 1 offset
      // Sun (0) -> 6 offset
      const startDayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const blanks = Array.from({ length: startDayOffset });
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      return (
          <div className="flex-1 overflow-y-auto p-4 bg-white custom-scrollbar">
              <div className="grid grid-cols-7 gap-4 auto-rows-[120px]">
                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                       <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase mb-2">{d}</div>
                   ))}
                   {/* Blank days */}
                   {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-slate-50/50 rounded-xl" />)}
                   
                   {/* Real days */}
                   {days.map(d => {
                       const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                       const dayEvents = getEventsForDay(date);
                       const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth();
                       const isFlo = isFloDay(date);

                       return (
                           <div key={d} className={`border border-slate-100 rounded-xl p-2 relative hover:shadow-md transition-all flex flex-col ${isToday ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                               <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-bold block ${isToday ? 'text-emerald-700' : 'text-slate-700'}`}>{d}</span>
                                    {isFlo && (
                                        <div className="w-8 h-1.5 rounded-full bg-pink-200" title="Flo Cycle"></div>
                                    )}
                               </div>
                               
                               <div className="space-y-1 overflow-hidden flex-1 relative">
                                   {dayEvents.slice(0, 3).map(e => {
                                       const styleClass = e.color ? `${e.color} text-white` : getSourceColor(e);
                                       const isHealth = e.source === EventSource.HEALTH;
                                       
                                       // Content for tooltips & display
                                       const tooltipContent = (
                                           <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-50 w-40 bg-slate-800 text-white text-xs p-2 rounded shadow-lg pointer-events-none">
                                               <div className="font-bold mb-1 truncate">{e.title}</div>
                                               {e.location && <div className="text-slate-300 mb-1 truncate">{e.location}</div>}
                                               <div className="text-slate-400">{e.start.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</div>
                                                {e.source === EventSource.HEALTH && e.status && (
                                                  <div className={`font-bold mt-1 uppercase text-[10px] ${e.status === 'completed' ? 'text-emerald-400' : e.status === 'missed' ? 'text-red-400' : 'text-slate-400'}`}>
                                                      {e.status}
                                                  </div>
                                              )}
                                           </div>
                                       );

                                       // Specialized render for workout dots/bars in Month view
                                       if (isHealth) {
                                           return (
                                               <div key={e.id} className="flex items-center gap-1.5 px-1 py-0.5 rounded-md hover:bg-slate-50 group relative">
                                                   <div className={`w-2 h-2 rounded-full ${e.status === 'missed' ? 'bg-transparent border border-red-300' : 'bg-red-500'}`}></div>
                                                   <span className={`text-[9px] truncate ${e.status === 'missed' ? 'text-slate-400 line-through' : 'text-slate-600 font-bold'}`}>
                                                       {e.title}
                                                   </span>
                                                   {tooltipContent}
                                               </div>
                                           )
                                       }

                                       return (
                                           <div key={e.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded border-l-2 flex items-center gap-1 ${styleClass} bg-opacity-80 group relative ${e.status === 'missed' ? 'opacity-50 line-through' : ''}`}>
                                               {getSourceIcon(e)}
                                               {e.title}
                                               {tooltipContent}
                                           </div>
                                       )
                                   })}
                                   {dayEvents.length > 3 && (
                                       <div className="text-[9px] text-slate-400 pl-1">+{dayEvents.length - 3} more</div>
                                   )}
                               </div>
                           </div>
                       );
                   })}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-white text-slate-800 overflow-hidden">
      
      {/* MAIN CALENDAR CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        
        {/* TOOLBAR */}
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-20 flex-shrink-0 gap-2 relative">
            <div className="flex items-center gap-2 md:gap-4 overflow-hidden flex-1 min-w-0">
                <div className="flex items-center bg-slate-100 rounded-full p-1 flex-shrink-0">
                    <button onClick={() => setViewMode('day')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Day</button>
                    <button onClick={() => setViewMode('week')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Week</button>
                    <button onClick={() => setViewMode('month')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Month</button>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => navigate('prev')} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={goToToday} className="text-sm font-bold text-slate-600 hover:text-emerald-600 px-2 hidden sm:block">Today</button>
                    <button onClick={() => navigate('next')} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
                </div>
                
                <h2 className="text-lg md:text-xl font-serif font-bold text-slate-800 ml-1 truncate min-w-[50px]">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
            </div>

            <button 
                onClick={openNewEventModal}
                className="flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-slate-200 transition-all font-bold text-xs uppercase tracking-wide relative z-30"
            >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Add Event</span>
            </button>
        </div>
        
        {/* LEGEND - Condition rendering based on synced status */}
        <Legend isGoogle={isGoogleConnected} isTUM={isTUMConnected} isFlo={isFloConnected} />

        {/* HEADER DAYS (Only for Week/Day view) */}
        {viewMode !== 'month' && (
            <div className={`grid border-b border-slate-100 bg-slate-50/50 flex-shrink-0 ${viewMode === 'day' ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_repeat(7,1fr)]'}`}>
                <div className="p-4 border-r border-slate-100 text-[10px] font-bold text-slate-400 flex items-center justify-center">
                Time
                </div>
                {(viewMode === 'day' ? [currentDate] : weekDays).map((day, idx) => {
                const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
                const isFlo = isFloDay(day);

                return (
                    <div key={idx} className={`p-3 text-center border-r border-slate-100 relative ${isToday ? 'bg-emerald-50/30' : ''}`}>
                        <div className={`text-[10px] uppercase font-bold mb-1 ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-xl font-serif ${isToday ? 'text-emerald-700 font-bold' : 'text-slate-700'}`}>
                            {day.getDate()}
                        </div>
                        {/* FLO INDICATOR - Under Date Number */}
                        {isFlo && (
                            <div className="mt-1 mx-auto w-12 h-1.5 rounded-full bg-pink-200" title="Flo Cycle Phase"></div>
                        )}
                    </div>
                )
                })}
            </div>
        )}

        {/* MAIN VIEW */}
        {viewMode === 'month' 
            ? renderMonthView() 
            : renderTimeGrid(viewMode === 'day' ? [currentDate] : weekDays)
        }
      </div>

      {/* SMART SUGGESTIONS SIDEBAR (OPT-IN) - RESPONSIVE STACK */}
      <div className="w-full md:w-64 lg:w-80 h-auto md:h-full border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50 flex flex-col flex-shrink-0 overflow-hidden max-h-[300px] md:max-h-none z-10">
         <div className="p-4 md:p-6 border-b border-slate-100 bg-white flex-shrink-0">
             <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-emerald-500" />
                 Smart Suggestions
             </h3>
             <p className="text-xs text-slate-500 mt-1">AI-optimized blocks based on your load.</p>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {!hasCompletedCheckin ? (
                  <div className="text-center py-10 px-4 opacity-70">
                     <Activity className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
                     <p className="text-sm font-bold text-slate-500">Check-in Required</p>
                     <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                         Smart suggestions only appear after you complete your Daily Pulse to ensure they match your energy.
                     </p>
                  </div>
             ) : suggestedEvents.length === 0 ? (
                 <div className="text-center py-10 opacity-50">
                     <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                     <p className="text-sm font-bold text-slate-400">No suggestions yet.</p>
                 </div>
             ) : (
                 suggestedEvents.map((evt, idx) => {
                     const styleClass = getSourceColor(evt);
                     return (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer" onClick={() => openEditModalForSuggestion(evt)}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${styleClass.split(' ')[0]}`}></div>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                        {evt.start.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                                    </span>
                                    <h4 className="font-bold text-slate-700 text-sm leading-tight mb-1">{evt.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2">{evt.description}</p>
                                </div>
                                <button 
                                    className="ml-2 p-2 bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-xl text-slate-400 transition-colors shadow-sm"
                                    title="Edit & Add to Calendar"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                     )
                 })
             )}
         </div>
      </div>

      {/* ADD EVENT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-serif font-bold text-slate-800">{activeSuggestion ? 'Edit Suggestion' : 'Add to Flow'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Event Title</label>
                          <input 
                             type="text" 
                             value={newEventTitle}
                             onChange={(e) => setNewEventTitle(e.target.value)}
                             placeholder="Coffee with Mom..."
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:border-emerald-400 outline-none"
                             autoFocus
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Start Time</label>
                                <input 
                                    type="time"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:border-emerald-400 outline-none"
                                />
                           </div>
                           <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Duration (mins)</label>
                                <select 
                                    value={newEventDuration}
                                    onChange={(e) => setNewEventDuration(parseInt(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:border-emerald-400 outline-none"
                                >
                                    <option value={15}>15m</option>
                                    <option value={30}>30m</option>
                                    <option value={45}>45m</option>
                                    <option value={60}>1h</option>
                                    <option value={90}>1.5h</option>
                                    <option value={120}>2h</option>
                                </select>
                           </div>
                      </div>
                       <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Category</label>
                            <select 
                                value={newEventCategory}
                                onChange={(e) => setNewEventCategory(e.target.value as EventSource)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:border-emerald-400 outline-none"
                            >
                                <option value={EventSource.SOCIAL}>Social</option>
                                <option value={EventSource.SCHOOL}>School / Work</option>
                                <option value={EventSource.WELLNESS}>Wellness</option>
                            </select>
                       </div>

                      <button 
                        onClick={handleCreateEvent}
                        disabled={!newEventTitle}
                        className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg mt-4 transition-colors disabled:opacity-50"
                      >
                          {activeSuggestion ? 'Confirm & Add' : 'Add Event'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};