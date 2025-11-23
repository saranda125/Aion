
import React, { useState, useEffect } from 'react';
import { WellnessMetrics, Mood, UserProfile, Persona } from '../types';
import { Moon, AlertCircle, Smile, Meh, Coffee, Zap, ArrowRight, Sparkles, Flame, CloudRain, Lock } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onSubmit: (metrics: WellnessMetrics) => void;
  isLoading: boolean;
  onBack: () => void;
  persona: Persona;
}

const QUOTES_BY_PERSONA = {
    'Neutral / Stoic': [
        { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
        { text: "Balance is the key to everything.", author: "Koi Fresco" },
        { text: "Relax. Nothing is under control.", author: "Adi Da" },
    ],
    'Toxic Motivation': [
        { text: "SLEEP IS A CRUTCH. (BUT USE IT TO RELOAD.)", author: "THE GRIND" },
        { text: "PAIN IS WEAKNESS LEAVING THE BODY.", author: "MARINES" },
        { text: "NOBODY CARES. WORK HARDER.", author: "REALITY" },
    ],
    'Softer / Empathetic': [
        { text: "You are enough, just as you are, in this moment.", author: "Meghan Markle" },
        { text: "Rest is a vital part of your journey.", author: "John Lubbock" },
        { text: "Be gentle with yourself. You're doing your best.", author: "Unknown" },
    ]
};

// Helper to get dynamic labels based on persona
const getPersonaLabels = (persona: Persona) => {
    switch (persona) {
        case 'Toxic Motivation':
            return {
                titleBadge: "COMBAT READINESS",
                subtitle: "REPORT STATUS. NO EXCUSES.",
                sleepLabel: "RECOVERY HOURS",
                stressLabel: "SYSTEM FAILURE RISK",
                moodLabel: "OPERATIONAL CAPACITY",
                submitBtn: "SUBMIT REPORT",
                loading: "ASSESSING WEAKNESS...",
            };
        case 'Softer / Empathetic':
            return {
                titleBadge: "Heart Space",
                subtitle: "How are you feeling, really?",
                sleepLabel: "Rest & Dreams",
                stressLabel: "Internal Weather",
                moodLabel: "Emotional Color",
                submitBtn: "Wrap Me In Warmth",
                loading: "Listening to you...",
            };
        default: // Neutral
            return {
                titleBadge: "Daily Pulse",
                subtitle: "Let's tune in. How is your system running today?",
                sleepLabel: "Sleep Tank",
                stressLabel: "Stress Level",
                moodLabel: "Current Vibe",
                submitBtn: "Calculate Balance",
                loading: "Analyzing System Load...",
            };
    }
};

const getAccentColor = (persona: Persona) => {
    switch(persona) {
        case 'Toxic Motivation': return 'text-slate-900';
        case 'Softer / Empathetic': return 'text-rose-500';
        default: return 'text-emerald-500';
    }
}

const getButtonClass = (persona: Persona, isActive: boolean) => {
     if (persona === 'Toxic Motivation') {
         return isActive ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400';
     }
     if (persona === 'Softer / Empathetic') {
         return isActive ? 'bg-rose-400 border-rose-400 text-white shadow-lg shadow-rose-200' : 'bg-white border-rose-100 text-rose-300 hover:border-rose-300';
     }
     return isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600';
}

const getMainButtonClass = (persona: Persona) => {
    switch(persona) {
        case 'Toxic Motivation': return 'bg-slate-950 hover:bg-red-600 shadow-slate-400';
        case 'Softer / Empathetic': return 'bg-rose-400 hover:bg-rose-500 shadow-rose-200';
        default: return 'bg-slate-900 hover:bg-emerald-600 shadow-slate-200';
    }
}

export const WellnessCheckin: React.FC<Props> = ({ profile, onSubmit, isLoading, onBack, persona }) => {
  const [metrics, setMetrics] = useState<WellnessMetrics>({
    sleepHours: 7,
    stressLevel: 5,
    mood: 'Okay',
    customActivity: ''
  });

  const [quote, setQuote] = useState(QUOTES_BY_PERSONA['Neutral / Stoic'][0]);
  const labels = getPersonaLabels(persona);

  useEffect(() => {
      const quotes = QUOTES_BY_PERSONA[persona] || QUOTES_BY_PERSONA['Neutral / Stoic'];
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [persona]);

  const moods: { label: Mood; icon: React.ReactNode }[] = [
    { label: 'Great', icon: <Zap className="w-5 h-5" /> },
    { label: 'Okay', icon: <Smile className="w-5 h-5" /> },
    { label: 'Tired', icon: <Coffee className="w-5 h-5" /> },
    { label: 'Stressed', icon: <AlertCircle className="w-5 h-5" /> },
    { label: 'Anxious', icon: <Meh className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full min-h-[600px] h-auto bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row relative group mb-10">
      
      {/* Left Panel: Form */}
      <div className="flex-1 flex flex-col p-8 md:p-12 relative z-10">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${persona === 'Toxic Motivation' ? 'bg-slate-900 text-white' : persona === 'Softer / Empathetic' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {labels.titleBadge}
                </span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-3 tracking-tight">
                Hey, {profile.name}.
            </h2>
            <p className="text-base text-slate-500 font-medium">
                {labels.subtitle}
            </p>
          </div>

          {/* Dynamic Form Content */}
          <div className="flex-1 space-y-10">
            
            {/* SLEEP */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-6">
                        <Moon className={`w-4 h-4 ${getAccentColor(persona)}`} />
                        {labels.sleepLabel}
                </label>
                <div className="flex items-center gap-6">
                    <div className="flex-1 relative h-14 flex items-center">
                        <div className="absolute inset-x-0 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${persona === 'Toxic Motivation' ? 'bg-slate-800' : persona === 'Softer / Empathetic' ? 'bg-rose-300' : 'bg-emerald-400'}`} style={{ width: `${(metrics.sleepHours / 12) * 100}%` }}></div>
                        </div>
                        <input
                            type="range" min="0" max="12" step="0.5"
                            value={metrics.sleepHours}
                            onChange={(e) => setMetrics({ ...metrics, sleepHours: parseFloat(e.target.value) })}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                        />
                        <div 
                            className={`absolute w-8 h-8 bg-white border-4 rounded-full shadow-lg pointer-events-none transition-all duration-300 flex items-center justify-center z-10 ${persona === 'Toxic Motivation' ? 'border-slate-800' : persona === 'Softer / Empathetic' ? 'border-rose-300' : 'border-emerald-400'}`}
                            style={{ left: `calc(${(metrics.sleepHours / 12) * 100}% - 16px)` }}
                        >
                        </div>
                    </div>
                    <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center border shadow-sm ${persona === 'Toxic Motivation' ? 'bg-slate-100 text-slate-900 border-slate-200' : persona === 'Softer / Empathetic' ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
                        <span className="text-3xl font-serif font-bold leading-none">{metrics.sleepHours}</span>
                        <span className="text-[10px] font-bold uppercase mt-1 opacity-60">Hrs</span>
                    </div>
                </div>
            </div>

            {/* STRESS */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
                    <span className="flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 ${getAccentColor(persona)}`} />
                        {labels.stressLabel}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm ${metrics.stressLevel > 7 ? 'bg-rose-500' : metrics.stressLevel > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                        {metrics.stressLevel}/10
                    </span>
                </label>
                <input
                    type="range" min="1" max="10"
                    value={metrics.stressLevel}
                    onChange={(e) => setMetrics({ ...metrics, stressLevel: parseInt(e.target.value) })}
                    className="w-full h-4 bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400 rounded-full appearance-none cursor-pointer accent-white shadow-inner"
                />
            </div>

            {/* MOOD */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-6">
                    <Zap className={`w-4 h-4 ${getAccentColor(persona)}`} />
                    {labels.moodLabel}
                </label>
                <div className="grid grid-cols-5 gap-3">
                {moods.map((m) => (
                    <button
                    key={m.label}
                    onClick={() => setMetrics({ ...metrics, mood: m.label })}
                    className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border-2 ${getButtonClass(persona, metrics.mood === m.label)}`}
                    >
                    {m.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wide">{m.label}</span>
                    </button>
                ))}
                </div>
            </div>
            
          </div>

          {/* Action Button */}
          <div className="mt-10 pt-6 border-t border-slate-100">
             <button
                onClick={() => onSubmit(metrics)}
                disabled={isLoading}
                className={`w-full text-white h-16 rounded-2xl font-bold text-sm tracking-widest uppercase shadow-xl flex items-center justify-center gap-3 group transition-all disabled:opacity-70 disabled:cursor-wait hover:scale-[1.02] active:scale-[0.98] ${getMainButtonClass(persona)}`}
             >
                {isLoading ? (
                    <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {labels.loading}
                    </>
                ) : (
                    <>
                    {labels.submitBtn}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
             </button>
          </div>

      </div>

      {/* Right Panel: Image */}
      <div className="hidden md:block w-[35%] relative bg-slate-100 overflow-hidden">
         <img 
            src={persona === 'Toxic Motivation' 
                ? "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop" // Dark gym/grit
                : persona === 'Softer / Empathetic'
                ? "https://images.unsplash.com/photo-1518531933037-9a60aa2036a6?q=80&w=2000&auto=format&fit=crop" // Soft flower
                : "https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?q=80&w=2000&auto=format&fit=crop" // Nature
            }
            alt="Wellness" 
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-500"
         />
         <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${persona === 'Toxic Motivation' ? 'from-black/80' : 'from-emerald-900/60'}`}></div>
         
         <div className="absolute bottom-10 left-10 right-10 text-white animate-in slide-in-from-bottom-8 duration-700">
             <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/10">
                 {persona === 'Toxic Motivation' ? <Flame className="w-5 h-5 text-red-400" /> : <Sparkles className="w-5 h-5 text-emerald-300" />}
             </div>
             <p className="font-serif text-xl leading-relaxed font-medium text-shadow-sm">
                 "{quote.text}"
             </p>
             <p className="text-xs font-bold opacity-80 mt-3 tracking-widest uppercase text-emerald-300">— {quote.author}</p>
         </div>
      </div>

    </div>
  );
};
