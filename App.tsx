import React, { useState } from 'react';
import { CoachWidget } from './components/CoachWidget';
import { WellnessCheckin } from './components/WellnessCheckin';
import { DailyPlanView } from './components/DailyPlanView';
import { RoleSelection } from './components/RoleSelection';
import { WellnessMetrics, DayAnalysis, EventSource, BurnoutLevel } from './types';
import { analyzeWellnessAndPlan } from './services/geminiService';
import { Layout, Activity, Calendar as CalendarIcon } from 'lucide-react';

export default function App() {
  const [roles, setRoles] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<WellnessMetrics | null>(null);
  const [dayAnalysis, setDayAnalysis] = useState<DayAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'roles' | 'checkin' | 'dashboard'>('roles');

  const handleRolesComplete = (selectedRoles: string[]) => {
    setRoles(selectedRoles);
    setView('checkin');
  };

  const handleCheckinSubmit = async (data: WellnessMetrics) => {
    const fullData = { ...data, roles };
    setMetrics(fullData);
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeWellnessAndPlan(fullData);
      
      const schedule = result.scheduleItems.map((item: any, idx: number) => {
        const start = new Date();
        start.setHours(Math.floor(item.startOffsetHours), (item.startOffsetHours % 1) * 60, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + item.durationMinutes);

        return {
          id: `plan-${idx}`,
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
        schedule
      });
      
      setView('dashboard');
    } catch (error) {
      console.error(error);
      alert("Could not connect to Aion brain. Check API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden text-slate-800 font-sans">
      
      {/* Header */}
      <header className="h-16 px-6 md:px-10 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-md z-20 sticky top-0">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('roles')}>
            <div className="w-8 h-8 bg-aion-primary rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                <span className="font-serif font-bold text-white text-lg">A</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-800 tracking-tight">Aion</h1>
         </div>
         
         {view === 'dashboard' && (
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <span className="hidden md:inline px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                    Roles: <span className="text-aion-primary font-semibold">{roles.slice(0, 2).join(', ')}{roles.length > 2 ? '...' : ''}</span>
                </span>
                <div className="w-9 h-9 rounded-full bg-emerald-100 border-2 border-white shadow-sm overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                </div>
            </div>
         )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        
        {/* Organic Background Shapes (Green/Modern) */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-100/50 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-green-50/80 rounded-full blur-[80px] pointer-events-none"></div>

        {view === 'roles' && (
           <div className="flex-1 flex items-center justify-center p-4 z-10 overflow-y-auto">
              <RoleSelection onComplete={handleRolesComplete} />
           </div>
        )}

        {view === 'checkin' && (
          <div className="flex-1 flex items-center justify-center p-4 z-10">
            <WellnessCheckin roles={roles} onSubmit={handleCheckinSubmit} isLoading={isAnalyzing} />
          </div>
        )}

        {view === 'dashboard' && dayAnalysis && (
            <div className="flex-1 z-10 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full">
                <div className="flex-1 h-full relative">
                    <DailyPlanView analysis={dayAnalysis} />
                </div>
            </div>
        )}

        {/* Floating Widget Container */}
        {view !== 'roles' && (
            <div className="absolute bottom-6 right-6 z-50">
              <CoachWidget />
            </div>
        )}

      </main>
    </div>
  );
}