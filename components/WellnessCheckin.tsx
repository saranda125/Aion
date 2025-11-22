import React, { useState, useEffect } from 'react';
import { WellnessMetrics, Mood } from '../types';
import { Moon, BookOpen, AlertCircle, Smile, Meh, Coffee, Zap, Calendar, Plus, X, Check } from 'lucide-react';

interface Props {
  roles: string[];
  onSubmit: (metrics: WellnessMetrics) => void;
  isLoading: boolean;
}

// Suggested activities based on common roles
const ACTIVITY_SUGGESTIONS: Record<string, string[]> = {
  'Student': ['Math Homework', 'Essay Writing', 'Group Project', 'Exam Prep', 'Lecture'],
  'Parent': ['Daycare Drop-off', 'School Run', 'Meal Prep', 'Bedtime Routine', 'Pediatrician'],
  'Professional': ['Client Meeting', 'Deep Work', 'Email Triage', 'Team Sync', 'Project Planning'],
  'Athlete': ['Gym Session', 'Recovery', 'Physio', 'Meal Prep', 'Cardio'],
  'Creative': ['Brainstorming', 'Drafting', 'Editing', 'Inspiration Walk', 'Portfolio Update'],
  'General': ['Reading', 'Grocery Shopping', 'Laundry', 'Meditation', 'Walk the Dog', 'Commute']
};

export const WellnessCheckin: React.FC<Props> = ({ roles, onSubmit, isLoading }) => {
  const [step, setStep] = useState(1);
  const [metrics, setMetrics] = useState<WellnessMetrics>({
    roles: roles,
    sleepHours: 7,
    stressLevel: 5,
    mood: 'Okay',
    studyHoursPlanned: 4,
    deadlines: '',
    obligations: ''
  });

  // State for the "Drag and Drop" style selection
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setMetrics(prev => ({ ...prev, roles: roles }));
  }, [roles]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Combine selected activities into the string format expected by the AI service
      const finalMetrics = {
        ...metrics,
        obligations: selectedActivities.join(', ')
      };
      onSubmit(finalMetrics);
    }
  };

  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(prev => prev.filter(a => a !== activity));
    } else {
      setSelectedActivities(prev => [...prev, activity]);
    }
  };

  const addCustomActivity = () => {
    if (customActivity.trim()) {
      toggleActivity(customActivity.trim());
      setCustomActivity('');
    }
  };

  // Simulate connecting to an external calendar
  const simulateCalendarSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const mockEvents = ['Dentist Appt (2pm)', 'Team Sync (10am)', 'Submit Report'];
      // Add only unique events
      const newEvents = mockEvents.filter(e => !selectedActivities.includes(e));
      setSelectedActivities(prev => [...prev, ...newEvents]);
      setIsSyncing(false);
    }, 1500);
  };

  const getWorkLabel = () => {
    const r = roles.map(r => r.toLowerCase());
    if (r.includes('student') && r.includes('professional')) return "Work & Study Hours";
    if (r.includes('student')) return "Study Hours";
    if (r.includes('professional') || r.includes('worker')) return "Deep Work Hours";
    if (r.includes('parent')) return "Core Responsibility Hours";
    return "Focus/Work Hours";
  };

  const moods: { label: Mood; icon: React.ReactNode }[] = [
    { label: 'Great', icon: <Zap className="w-6 h-6 text-amber-400" /> },
    { label: 'Okay', icon: <Smile className="w-6 h-6 text-emerald-400" /> },
    { label: 'Tired', icon: <Coffee className="w-6 h-6 text-slate-400" /> },
    { label: 'Stressed', icon: <AlertCircle className="w-6 h-6 text-rose-400" /> },
    { label: 'Anxious', icon: <Meh className="w-6 h-6 text-purple-400" /> },
  ];

  // Get relevant suggestions based on selected roles
  const getSuggestions = () => {
    let suggestions = [...ACTIVITY_SUGGESTIONS['General']];
    roles.forEach(role => {
      if (ACTIVITY_SUGGESTIONS[role]) {
        suggestions = [...suggestions, ...ACTIVITY_SUGGESTIONS[role]];
      }
    });
    // Remove duplicates
    return Array.from(new Set(suggestions));
  };

  return (
    <div className="max-w-lg mx-auto mt-4 p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl shadow-slate-200/50 w-full relative overflow-hidden">
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1 bg-emerald-100 w-full">
        <div className="h-full bg-aion-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="mb-8 mt-2">
        <h2 className="text-3xl font-serif font-bold text-slate-800">
          {step === 3 ? "What's on the docket?" : "Daily Check-in"}
        </h2>
        <p className="text-slate-500 mt-1">Logging as: <span className="text-aion-primary font-semibold">{roles.join(', ')}</span></p>
      </div>

      {/* STEP 1: PHYSICAL STATE */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-500" />
              How many hours did you sleep?
            </label>
            <div className="flex items-center gap-4">
                <input
                type="range"
                min="0"
                max="14"
                step="0.5"
                value={metrics.sleepHours}
                onChange={(e) => setMetrics({ ...metrics, sleepHours: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-aion-primary"
                />
                <span className="min-w-[4rem] text-center px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-800 border border-slate-200">
                    {metrics.sleepHours}h
                </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">Current Mood</label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMetrics({ ...metrics, mood: m.label })}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all border ${
                    metrics.mood === m.label
                      ? 'bg-emerald-50 border-emerald-200 text-slate-900 ring-2 ring-emerald-500 ring-offset-2'
                      : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {m.icon}
                  <span className="text-[10px] font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MENTAL LOAD */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Stress Level (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={metrics.stressLevel}
              onChange={(e) => setMetrics({ ...metrics, stressLevel: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
              <span>Chill</span>
              <span className="text-slate-800 font-bold text-lg bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 -mt-3">{metrics.stressLevel}</span>
              <span>Overwhelmed</span>
            </div>
          </div>
           
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              {getWorkLabel()} Needed
            </label>
             <input
              type="number"
              min="0"
              max="12"
              value={metrics.studyHoursPlanned}
              onChange={(e) => setMetrics({ ...metrics, studyHoursPlanned: parseFloat(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 focus:ring-2 focus:ring-aion-primary/20 focus:border-aion-primary focus:outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* STEP 3: ACTIVITIES & OBLIGATIONS */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          
          {/* Sync Button */}
          <button 
            onClick={simulateCalendarSync}
            disabled={isSyncing}
            className="w-full py-3 px-4 bg-slate-50 hover:bg-blue-50 border border-dashed border-slate-300 hover:border-blue-300 rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600 transition-all group"
          >
            {isSyncing ? (
               <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
               <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-medium text-sm">{isSyncing ? "Syncing calendars..." : "Autofill from Google Calendar / Tum"}</span>
          </button>

          {/* Custom Input */}
          <div className="flex gap-2">
            <input 
               type="text"
               value={customActivity}
               onChange={(e) => setCustomActivity(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && addCustomActivity()}
               placeholder="Add something else..."
               className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-aion-primary"
            />
            <button 
              onClick={addCustomActivity}
              className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Selected Activities (The "Basket") */}
          {selectedActivities.length > 0 && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
               <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 block">Your Plan Today</label>
               <div className="flex flex-wrap gap-2">
                 {selectedActivities.map(activity => (
                   <button 
                     key={activity}
                     onClick={() => toggleActivity(activity)}
                     className="bg-white border border-emerald-200 text-slate-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm hover:shadow hover:text-rose-500 hover:border-rose-200 group transition-all"
                   >
                      {activity}
                      <X className="w-3 h-3 text-slate-300 group-hover:text-rose-500" />
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* Suggestions Cloud */}
          <div>
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Suggested for you</label>
             <div className="flex flex-wrap gap-2">
               {getSuggestions().filter(s => !selectedActivities.includes(s)).map(suggestion => (
                 <button
                    key={suggestion}
                    onClick={() => toggleActivity(suggestion)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-100 hover:border-aion-primary/50 rounded-full text-sm text-slate-600 hover:text-aion-primary transition-all flex items-center gap-1"
                 >
                    <Plus className="w-3 h-3 opacity-50" />
                    {suggestion}
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-between items-center">
        {step > 1 ? (
            <button 
                onClick={() => setStep(step - 1)}
                className="text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
                Back
            </button>
        ) : <div></div>}

        <button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-aion-primary hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
        >
          {isLoading ? (
              <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Planning...
              </div>
          ) : step === 3 ? 'Generate My Plan' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};