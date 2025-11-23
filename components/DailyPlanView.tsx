import React from 'react';
import { BurnoutLevel, DayAnalysis, SuggestionType, Persona } from '../types';
import { 
  Activity, AlertTriangle, Zap, Sparkles, Lightbulb, 
  ArrowRight, Heart, Flame, RefreshCw
} from 'lucide-react';

interface Props {
  analysis: DayAnalysis;
  persona: Persona;
  onNewCheckin?: () => void;
  onGoToCalendar: () => void;
}

// Helper for persona-specific labels
const getPersonaHeaders = (persona: Persona) => {
    switch (persona) {
        case 'Toxic Motivation':
            return {
                systemLoad: "FAILURE PROBABILITY",
                vibeCheck: "HARD TRUTH",
                suggestions: "TACTICAL IMPROVEMENTS",
                goCalendar: "EXECUTE MISSION"
            };
        case 'Softer / Empathetic':
            return {
                systemLoad: "Emotional Battery",
                vibeCheck: "A Gentle Note",
                suggestions: "Nourishing Ideas",
                goCalendar: "View Gentle Flow"
            };
        default:
            return {
                systemLoad: "System Load",
                vibeCheck: "Vibe Check",
                suggestions: "Smart Suggestions",
                goCalendar: "Go to Calendar"
            };
    }
};

const getRiskColor = (level: BurnoutLevel, persona: Persona) => {
    if (persona === 'Toxic Motivation') {
         return 'bg-slate-100 border-slate-200 text-slate-800'; // Industrial look
    }
  switch (level) {
    case BurnoutLevel.LOW: return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    case BurnoutLevel.MEDIUM: return 'bg-amber-50 border-amber-100 text-amber-700';
    case BurnoutLevel.HIGH: return 'bg-rose-50 border-rose-100 text-rose-700';
  }
};

const getSuggestionIcon = (type: SuggestionType) => {
    switch(type) {
        case 'warning': return <AlertTriangle className="w-6 h-6 text-rose-500" />;
        case 'optimization': return <Zap className="w-6 h-6 text-blue-500" />;
        case 'opportunity': return <Sparkles className="w-6 h-6 text-emerald-500" />;
        case 'insight': return <Lightbulb className="w-6 h-6 text-amber-500" />;
    }
};

const getSuggestionGradient = (type: SuggestionType) => {
     switch(type) {
        case 'warning': return 'bg-gradient-to-br from-rose-50 to-white border-rose-100 hover:shadow-rose-100';
        case 'optimization': return 'bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-blue-100';
        case 'opportunity': return 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:shadow-emerald-100';
        case 'insight': return 'bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:shadow-amber-100';
    }
}

export const DailyPlanView: React.FC<Props> = ({ analysis, persona, onNewCheckin, onGoToCalendar }) => {
  const headers = getPersonaHeaders(persona);

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50 custom-scrollbar flex flex-col p-6 md:p-10">
      
      <div className="max-w-5xl mx-auto w-full space-y-10 pb-10">
          
          {/* Header Row with Update Button */}
          <div className="flex justify-end">
              <button 
                onClick={onNewCheckin}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-200 shadow-sm transition-colors"
              >
                  <RefreshCw className="w-3 h-3" />
                  Check-in Again
              </button>
          </div>

          {/* Section 1: SYSTEM LOAD & VIBE CHECK */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
             
             {/* System Load Gauge */}
             <div className={`md:col-span-2 p-8 rounded-[32px] border flex flex-col justify-between shadow-sm transition-all relative overflow-hidden ${getRiskColor(analysis.burnoutLevel, persona)}`}>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="font-bold uppercase tracking-wider text-xs opacity-80 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {headers.systemLoad}
                    </h3>
                  </div>
                  
                  <div className="flex items-end gap-2 relative z-10 my-4">
                    <span className="text-7xl font-serif font-bold tracking-tighter leading-none">{analysis.burnoutScore}</span>
                    <div className="flex flex-col mb-2">
                        <span className="text-xl leading-none font-medium text-opacity-60">%</span>
                    </div>
                  </div>

                  <div className="relative z-10">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-2 opacity-70">
                          <span>Low</span>
                          <span>Critical</span>
                      </div>
                      <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
                        <div 
                        className="h-full bg-current transition-all duration-1000 ease-out rounded-full" 
                        style={{ width: `${analysis.burnoutScore}%` }}
                        />
                      </div>
                      <p className="mt-4 text-sm font-medium opacity-90">
                          Current Status: <span className="font-bold">{analysis.burnoutLevel}</span>
                      </p>
                  </div>
             </div>

             {/* Vibe Check - Redesigned */}
             <div className="md:col-span-3 bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-center group">
                 <div className={`absolute inset-0 bg-gradient-to-br opacity-50 ${persona === 'Toxic Motivation' ? 'from-slate-100 via-white to-white' : persona === 'Softer / Empathetic' ? 'from-rose-50/50 via-white to-white' : 'from-emerald-50/50 via-white to-white'}`}></div>
                 
                 {/* Decorative Blobs */}
                 <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${persona === 'Toxic Motivation' ? 'bg-slate-200/30' : persona === 'Softer / Empathetic' ? 'bg-rose-100/30' : 'bg-emerald-100/30'}`}></div>
                 <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 ${persona === 'Toxic Motivation' ? 'bg-red-100/30' : 'bg-blue-100/30'}`}></div>

                 <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-6">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${persona === 'Toxic Motivation' ? 'bg-black' : persona === 'Softer / Empathetic' ? 'bg-rose-400' : 'bg-slate-900'}`}>
                             {persona === 'Toxic Motivation' ? <Flame className="w-5 h-5 fill-current text-red-500" /> : <Heart className="w-5 h-5 fill-current" />}
                         </div>
                         <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{headers.vibeCheck}</h3>
                     </div>
                     <p className="text-2xl md:text-3xl font-serif text-slate-800 leading-snug">
                        "{analysis.advice}"
                     </p>
                     
                     <button 
                        onClick={onGoToCalendar}
                        className={`mt-6 flex items-center gap-2 font-bold text-sm cursor-pointer hover:gap-3 transition-all group-hover:translate-x-1 ${persona === 'Toxic Motivation' ? 'text-slate-900' : persona === 'Softer / Empathetic' ? 'text-rose-500' : 'text-emerald-600'}`}
                     >
                         <span>{headers.goCalendar}</span>
                         <ArrowRight className="w-4 h-4" />
                     </button>
                 </div>
             </div>
          </div>

          {/* Section 2: DYNAMIC SUGGESTIONS */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div>
                  <h3 className="text-lg font-serif font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Sparkles className={`w-5 h-5 ${persona === 'Toxic Motivation' ? 'text-slate-900' : 'text-emerald-500'}`} />
                      {headers.suggestions}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {analysis.suggestions.map((suggestion, idx) => (
                          <div 
                            key={suggestion.id}
                            className={`p-6 rounded-[24px] border shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden ${getSuggestionGradient(suggestion.type)}`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                   {getSuggestionIcon(suggestion.type)}
                               </div>

                               <div className="flex flex-col h-full relative z-10">
                                   <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-700">
                                       {getSuggestionIcon(suggestion.type)}
                                   </div>
                                   
                                   <div className="mb-2 flex items-center gap-2">
                                       <span className="text-[10px] font-bold uppercase px-2 py-1 bg-white/80 backdrop-blur rounded-lg border border-slate-100">{suggestion.priority} Priority</span>
                                       {suggestion.timeSlot && (
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                                {suggestion.timeSlot}
                                            </span>
                                        )}
                                   </div>

                                   <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{suggestion.title}</h4>
                                   <p className="text-sm text-slate-600 leading-relaxed font-medium opacity-80">{suggestion.description}</p>
                               </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};