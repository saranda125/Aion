

import React, { useState, useMemo } from 'react';
import { CoachWidget } from './components/CoachWidget';
import { WellnessCheckin } from './components/WellnessCheckin';
import { DailyPlanView } from './components/DailyPlanView';
import { CalendarView } from './components/CalendarView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { LocationView, WeatherView, FitnessView, ToolsView } from './components/DashboardViews';
import { ProfileSettings } from './components/ProfileSettings';
import { WellnessMetrics, DayAnalysis, EventSource, BurnoutLevel, Persona, UserProfile, CalendarEvent } from './types';
import { analyzeWellnessAndPlan } from './services/geminiService';
import { generateWeeklyEvents } from './services/mockData';
import { 
  Layout, Activity, Calendar as CalendarIcon, MapPin, Cloud, 
  Timer, Info, Leaf, X, AlertTriangle, Zap, Sparkles, Heart, Flame
} from 'lucide-react';

type Tab = 'pulse' | 'calendar' | 'location' | 'weather' | 'fitness' | 'tools';

// Theme Configuration based on Persona
const getTheme = (persona: Persona) => {
    switch (persona) {
        case 'Toxic Motivation':
            return {
                bgGradient: 'from-slate-950 via-slate-900 to-black',
                sidebarBg: 'bg-slate-950',
                sidebarText: 'text-slate-200',
                accent: 'text-red-500',
                accentBg: 'bg-red-500',
                accentLight: 'bg-red-500/10',
                highlight: 'selection:bg-red-500 selection:text-white',
                button: 'bg-slate-900 hover:bg-red-600',
                navActive: 'text-red-500',
                navHover: 'hover:text-red-400'
            };
        case 'Softer / Empathetic':
            return {
                bgGradient: 'from-rose-50 via-rose-100/50 to-teal-50',
                sidebarBg: 'bg-rose-100', // Light sidebar for soft theme
                sidebarText: 'text-rose-900',
                accent: 'text-teal-600',
                accentBg: 'bg-teal-500',
                accentLight: 'bg-teal-50',
                highlight: 'selection:bg-rose-200 selection:text-rose-900',
                button: 'bg-rose-400 hover:bg-rose-500',
                navActive: 'text-teal-600',
                navHover: 'hover:text-teal-500'
            };
    default: // Neutral
            return {
                bgGradient: 'from-emerald-950 via-emerald-900 to-emerald-800',
                sidebarBg: 'bg-transparent',
                sidebarText: 'text-slate-200',
                accent: 'text-emerald-500',
                accentBg: 'bg-emerald-600',
                accentLight: 'bg-emerald-50',
                highlight: 'selection:bg-emerald-200 selection:text-emerald-900',
                button: 'bg-slate-900 hover:bg-emerald-600',
                navActive: 'text-emerald-600',
                navHover: 'hover:text-emerald-400'
            };
    }
};

const AboutOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-10 md:p-14 flex flex-col justify-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
             <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6 leading-tight">
            Balance isn't a destination.<br/>
            <span className="text-emerald-600">It's a vibe.</span>
          </h2>
          <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
            <p>
              We built Aion because the world is loud. Your schedule is chaotic. And "hustle culture" is honestly kind of exhausting.
            </p>
            <p>
              This isn't just a calendar. It's a <span className="font-bold text-emerald-700">reality check</span>. We use AI to look at your day, your mood, and your energy, then help you rearrange the pieces so you don't burn out.
            </p>
          </div>
        </div>
        <div className="relative h-64 md:h-auto bg-emerald-50">
           <img 
             src="https://images.unsplash.com/photo-1518531933037-9a60aa2036a6?q=80&w=2000&auto=format&fit=crop" 
             className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply"
             alt="Balance"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  // Application Flow State
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: '',
    hasCycle: false,
    familyRoles: [],
    careerRoles: [],
    avatarSeed: 'Felix',
    connectedApps: [],
    isGoogleCalendarConnected: false
  });
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState<Tab>('pulse');
  const [persona, setPersona] = useState<Persona>('Neutral / Stoic');
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Data State
  const [metrics, setMetrics] = useState<WellnessMetrics | null>(null);
  const [dayAnalysis, setDayAnalysis] = useState<DayAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  
  // Accepted suggestions tracking
  const [acceptedSuggestionIds, setAcceptedSuggestionIds] = useState<string[]>([]);

  // Derived Theme
  const theme = getTheme(persona);

  // Compute all events: Mock (Filtered) + User Added (AI suggestions are now SEPARATE)
  const allEvents = useMemo(() => {
    let baseEvents = generateWeeklyEvents();
    
    // FILTER: Only show TUM events if user CONNECTED TUM
    if (!profile.connectedApps?.includes('TUM Online')) {
        baseEvents = baseEvents.filter(e => e.source !== EventSource.TUM);
    }

    // FILTER: Only show Flo events if user tracks cycle
    if (!profile.hasCycle) {
      baseEvents = baseEvents.filter(e => e.source !== EventSource.FLO);
    }

    // FILTER: Only show Google events if user connected
    if (!profile.isGoogleCalendarConnected) {
        baseEvents = baseEvents.filter(e => e.source !== EventSource.GOOGLE);
    }

    // Note: We do NOT merge aiEvents here automatically anymore.
    // Only userEvents (which include accepted suggestions) are shown in the main grid.
    
    return [...baseEvents, ...userEvents];
  }, [profile.connectedApps, profile.hasCycle, profile.isGoogleCalendarConnected, userEvents]);

  // Filter out accepted suggestions from the display list of potential suggestions
  const suggestedEvents = useMemo(() => {
      if (!dayAnalysis?.schedule) return [];
      return dayAnalysis.schedule.filter(evt => !acceptedSuggestionIds.includes(evt.id));
  }, [dayAnalysis, acceptedSuggestionIds]);

  const handleOnboardingComplete = (userProfile: UserProfile) => {
    // Ensure consistency: if Flo is connected, enable cycle tracking logic
    const derivedProfile = {
        ...userProfile,
        hasCycle: userProfile.connectedApps?.includes('Flo') || userProfile.hasCycle
    };
    setProfile(derivedProfile);
    setHasOnboarded(true);
    setActiveTab('pulse');
  };

  const handleCheckinSubmit = async (data: WellnessMetrics) => {
    setMetrics(data);
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeWellnessAndPlan(profile, data, persona);
      
      const schedule = result.scheduleItems.map((item: any, idx: number) => {
        const start = new Date();
        start.setHours(Math.floor(item.startOffsetHours), (item.startOffsetHours % 1) * 60, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + item.durationMinutes);

        return {
          id: `plan-${Date.now()}-${idx}`,
          title: item.title,
          start,
          end,
          source: item.category === 'SCHOOL' ? EventSource.SCHOOL : 
                 item.category === 'WELLNESS' ? EventSource.WELLNESS : EventSource.SOCIAL,
          description: item.description,
          isFixed: false
        };
      });

      setDayAnalysis({
        burnoutLevel: result.burnoutLevel as BurnoutLevel,
        burnoutScore: result.burnoutScore,
        advice: result.advice,
        schedule, // These are now "Suggestions" until accepted
        suggestions: result.suggestions.map((s: any, i: number) => ({
            ...s,
            id: `sug-${i}`
        }))
      });
      
    } catch (error) {
      console.error(error);
      alert("Could not connect to Aion brain. Check API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
      setUserEvents(prev => [...prev, newEvent]);
  };

  const handleAcceptSuggestion = (suggestion: CalendarEvent) => {
      setAcceptedSuggestionIds(prev => [...prev, suggestion.id]);
      handleAddEvent({
          ...suggestion,
          source: EventSource.AION_AI // Mark accepted source explicitly
      });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pulse':
        if (!metrics) {
            // Allow full scrolling for wellness checkin
            return (
                <div className="h-full w-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <WellnessCheckin 
                        profile={profile}
                        onSubmit={handleCheckinSubmit} 
                        isLoading={isAnalyzing} 
                        onBack={() => {}} 
                        persona={persona}
                    />
                </div>
            );
        }
        return dayAnalysis ? (
           <div className="h-full w-full overflow-hidden">
              <DailyPlanView 
                analysis={dayAnalysis} 
                persona={persona} 
                onNewCheckin={() => { setMetrics(null); setDayAnalysis(null); }}
                onGoToCalendar={() => setActiveTab('calendar')}
              />
           </div>
        ) : (
             <div className="h-full flex items-center justify-center">
                 <div className="animate-pulse flex flex-col items-center gap-4">
                     <div className={`w-12 h-12 rounded-full ${theme.accentBg} opacity-20`}></div>
                     <p className="text-slate-400 font-bold">Initializing Analysis...</p>
                 </div>
             </div>
        );
      case 'calendar':
        return (
            <div className="h-full w-full overflow-hidden">
                <CalendarView 
                    events={allEvents} 
                    suggestedEvents={suggestedEvents}
                    currentDate={new Date()} 
                    onAddEvent={handleAddEvent}
                    onAcceptSuggestion={handleAcceptSuggestion}
                    isGoogleConnected={profile.isGoogleCalendarConnected}
                    isTUMConnected={profile.connectedApps?.includes('TUM Online')}
                    isFloConnected={profile.hasCycle}
                    hasCompletedCheckin={!!dayAnalysis}
                />
            </div>
        );
      case 'location':
        return <LocationView persona={persona} />;
      case 'weather':
        return <WeatherView persona={persona} />;
      case 'fitness':
        return (
          <FitnessView 
            persona={persona} 
            profile={profile} 
            metrics={metrics} 
            analysis={dayAnalysis}
            events={allEvents}
            onAddEvent={handleAddEvent}
          />
        );
      case 'tools':
        return <ToolsView persona={persona} />;
      default:
        return null;
    }
  };

  if (!hasOnboarded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2564&auto=format&fit=crop" 
                alt="Background" 
                className="w-full h-full object-cover opacity-30"
            />
            {/* STRICT GREEN GRADIENT: Harmonized to be purely emerald based */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/90 to-emerald-800/80 backdrop-blur-[1px]"></div>
        </div>
        <div className="z-10 w-full h-full relative overflow-y-auto">
            <OnboardingFlow onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  // Determine wrapper class for sidebar text based on theme logic
  const sidebarTextColor = persona === 'Softer / Empathetic' ? 'text-rose-900' : 'text-white';

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-700 bg-gradient-to-br ${theme.bgGradient} ${theme.highlight}`}>
      
      {showAbout && <AboutOverlay onClose={() => setShowAbout(false)} />}
      {showProfile && (
        <ProfileSettings 
            profile={profile} 
            persona={persona}
            onClose={() => setShowProfile(false)} 
            onUpdateProfile={setProfile}
            onUpdatePersona={setPersona}
        />
      )}

      {/* Sidebar with dynamic theme */}
      <aside className={`w-20 lg:w-64 flex flex-col z-20 flex-shrink-0 transition-all duration-300 ${persona === 'Softer / Empathetic' ? 'bg-white/50 backdrop-blur-md' : ''}`}>
         <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8">
            <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => setShowAbout(true)}>
                <div className={`w-10 h-10 rounded-xl shadow-lg shadow-black/20 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 ${persona === 'Softer / Empathetic' ? 'bg-rose-200' : 'bg-gradient-to-br from-white to-emerald-100'}`}>
                   {persona === 'Toxic Motivation' ? (
                       <Zap className="w-5 h-5 text-slate-900" />
                   ) : (
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${persona === 'Softer / Empathetic' ? 'text-rose-600' : 'text-emerald-700'}`}>
                          <circle cx="12" cy="18" r="4" fill="currentColor" fillOpacity="0.8" />
                          <circle cx="12" cy="11" r="3" fill="currentColor" fillOpacity="0.9" />
                          <circle cx="12" cy="5.5" r="1.5" fill="currentColor" />
                       </svg>
                   )}
                </div>
            </div>
            <div className="hidden lg:flex flex-col ml-3">
               <span className={`font-serif text-2xl font-bold tracking-tight leading-none ${sidebarTextColor}`}>Aion</span>
               <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${persona === 'Softer / Empathetic' ? 'text-rose-600' : 'text-emerald-400'}`}>Balance</span>
            </div>
         </div>

         <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
            <NavItem 
                icon={<Activity />} 
                label="Daily Pulse" 
                isActive={activeTab === 'pulse'} 
                onClick={() => setActiveTab('pulse')} 
                theme={theme}
                sidebarTextColor={sidebarTextColor}
            />
            <NavItem icon={<CalendarIcon />} label="My Calendar" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} theme={theme} sidebarTextColor={sidebarTextColor} />
            
            <div className={`my-4 border-t mx-2 ${persona === 'Softer / Empathetic' ? 'border-rose-200' : 'border-emerald-800/50'}`}></div>
            
            <NavItem icon={<MapPin />} label="Places" isActive={activeTab === 'location'} onClick={() => setActiveTab('location')} theme={theme} sidebarTextColor={sidebarTextColor} />
            <NavItem icon={<Cloud />} label="Weather" isActive={activeTab === 'weather'} onClick={() => setActiveTab('weather')} theme={theme} sidebarTextColor={sidebarTextColor} />
            <NavItem icon={<Zap />} label="Body & Rhythm" isActive={activeTab === 'fitness'} onClick={() => setActiveTab('fitness')} theme={theme} sidebarTextColor={sidebarTextColor} />
            <NavItem icon={<Timer />} label="Tools" isActive={activeTab === 'tools'} onClick={() => setActiveTab('tools')} theme={theme} sidebarTextColor={sidebarTextColor} />
         </nav>

         <div className="p-4">
            <button 
                onClick={() => setShowProfile(true)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors group border border-transparent ${persona === 'Softer / Empathetic' ? 'hover:bg-rose-200/50' : 'hover:bg-white/10 hover:border-white/20'}`}
            >
                <div className={`w-9 h-9 rounded-full overflow-hidden p-0.5 ${persona === 'Softer / Empathetic' ? 'bg-rose-300 border-rose-200' : 'bg-emerald-800 border-emerald-700'}`}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`} alt="User" className="w-full h-full bg-slate-100 rounded-full" />
                </div>
                <div className="hidden lg:block overflow-hidden text-left">
                    <p className={`text-xs font-bold truncate transition-colors ${sidebarTextColor}`}>Hey, {profile.name || 'Friend'}!</p>
                    <p className={`text-[10px] truncate ${persona === 'Softer / Empathetic' ? 'text-rose-600' : 'text-emerald-400/70'}`}>View Profile</p>
                </div>
            </button>
         </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden p-4 md:p-8 lg:p-10 transition-all">
         
         {/* THE WHITE PLACE - Main Content Container */}
         <div className={`bg-white w-full h-full rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative ring-1 ${persona === 'Softer / Empathetic' ? 'shadow-rose-900/10 ring-rose-900/5' : 'shadow-black/20 ring-black/5'}`}>
             
             <header className="h-16 px-6 md:px-10 flex items-center justify-between bg-white border-b border-slate-100 z-10 flex-shrink-0">
                 <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-3">
                    {activeTab === 'pulse' && <Activity className={`w-6 h-6 ${theme.accent}`} />}
                    {activeTab === 'calendar' && <CalendarIcon className={`w-6 h-6 ${theme.accent}`} />}
                    {activeTab === 'location' && <MapPin className={`w-6 h-6 ${theme.accent}`} />}
                    {activeTab === 'weather' && <Cloud className={`w-6 h-6 ${theme.accent}`} />}
                    {activeTab === 'fitness' && <Zap className={`w-6 h-6 ${theme.accent}`} />}
                    {activeTab === 'tools' && <Timer className={`w-6 h-6 ${theme.accent}`} />}
                    
                    <span>
                        {activeTab === 'pulse' ? 'Daily Pulse' : 
                         activeTab === 'fitness' ? 'Body & Rhythm' :
                         activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </span>
                 </h2>

                 <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setShowAbout(true)}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-all"
                     >
                        <Info className="w-3.5 h-3.5" />
                        Mission
                     </button>
                 </div>
             </header>

             <main className="flex-1 overflow-hidden relative bg-white flex flex-col">
                <div className="absolute inset-0 z-0 pointer-events-none">
                     <img 
                        src="https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2000&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-[0.03] mix-blend-multiply"
                        alt="Texture"
                     />
                     <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30"></div>
                </div>

                <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
                   {renderContent()}
                </div>

                {/* Footer Disclaimer - Sticky at bottom of white card */}
                <div className="relative z-20 bg-white/90 backdrop-blur-sm border-t border-slate-100 py-3 px-4 text-center flex-shrink-0">
                   <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      This tool offers general stress-management guidance and should not replace professional care.
                   </p>
                </div>
             </main>

             <div className="absolute bottom-14 right-6 z-50">
                <CoachWidget persona={persona} />
             </div>
         </div>
      </div>
    </div>
  );
}

const NavItem = ({ icon, label, isActive, onClick, theme, sidebarTextColor }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
            isActive 
            ? `bg-white shadow-md font-bold ${theme.navActive}` 
            : `${sidebarTextColor} opacity-70 hover:opacity-100 hover:bg-white/20 font-medium`
        }`}
    >
        <div className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? theme.navActive : 'text-current'}`}>
            {icon}
        </div>
        <span className="hidden lg:block text-sm">
            {label}
        </span>
    </button>
);