import React from 'react';
import { CalendarEvent, EventSource, BurnoutLevel, DayAnalysis } from '../types';
import { Flame, Book, Coffee, Gamepad2, Clock, Activity } from 'lucide-react';

interface Props {
  analysis: DayAnalysis;
}

const getRiskColor = (level: BurnoutLevel) => {
  switch (level) {
    case BurnoutLevel.LOW: return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    case BurnoutLevel.MEDIUM: return 'bg-amber-50 border-amber-100 text-amber-700';
    case BurnoutLevel.HIGH: return 'bg-rose-50 border-rose-100 text-rose-700';
  }
};

const getIcon = (source: EventSource) => {
  switch (source) {
    case EventSource.SCHOOL: return <Book className="w-4 h-4" />;
    case EventSource.WELLNESS: return <Coffee className="w-4 h-4" />;
    case EventSource.SOCIAL: return <Gamepad2 className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export const DailyPlanView: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 custom-scrollbar">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Burnout Score */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between shadow-sm ${getRiskColor(analysis.burnoutLevel)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold uppercase tracking-wider text-xs opacity-80">Burnout Risk</h3>
            <Activity className="w-5 h-5 opacity-80" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif font-bold">{analysis.burnoutScore}%</span>
            <span className="text-sm font-medium mb-1 pb-1 opacity-80">{analysis.burnoutLevel} Risk</span>
          </div>
          <div className="w-full bg-white/40 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-current transition-all duration-1000 ease-out" 
              style={{ width: `${analysis.burnoutScore}%` }}
            />
          </div>
        </div>

        {/* Vibe Check Advice */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-50"></div>
            <h3 className="font-bold text-aion-primary uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-aion-primary animate-pulse"></span>
                Aion's Vibe Check
            </h3>
            <p className="text-lg md:text-xl text-slate-700 font-medium leading-relaxed">
              "{analysis.advice}"
            </p>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-xl font-serif font-bold text-slate-800 mb-8 flex items-center gap-2">
          <Clock className="w-5 h-5 text-aion-primary" />
          Your Game Plan
        </h3>
        
        <div className="relative space-y-4 pl-4 md:pl-0">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-2 bottom-2 w-px bg-slate-200 hidden md:block"></div>

          {analysis.schedule.sort((a,b) => a.start.getTime() - b.start.getTime()).map((event, idx) => {
            const isLeft = idx % 2 === 0;
            
            return (
              <div key={event.id} className={`relative flex items-center ${isLeft ? 'md:flex-row-reverse' : ''} md:justify-between group`}>
                
                {/* Time Bubble (Center) */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold py-1.5 px-3 rounded-full z-10 w-18 text-center shadow-sm group-hover:border-aion-primary group-hover:text-aion-primary transition-colors">
                  {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-20 md:pl-0 ${isLeft ? 'md:pr-14' : 'md:pl-14'}`}>
                  <div className={`p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all ${
                    event.source === EventSource.SCHOOL ? 'border-l-[4px] border-l-blue-400' :
                    event.source === EventSource.WELLNESS ? 'border-l-[4px] border-l-emerald-400' :
                    'border-l-[4px] border-l-purple-400'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-800 text-sm md:text-base">{event.title}</h4>
                      <div className={`p-1.5 rounded-full bg-slate-50 text-slate-500`}>
                        {getIcon(event.source)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {event.description || "Stay focused and get it done."}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {Math.round((event.end.getTime() - event.start.getTime()) / 60000)} mins
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};