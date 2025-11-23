
import React, { useState } from 'react';
import { 
  User, Calendar, ArrowRight, Check, Baby, Heart, Users, Gem, 
  PawPrint, HelpCircle, GraduationCap, Stethoscope, DollarSign, 
  Palette, Code, BookOpen, Briefcase, FlaskConical, ShoppingBag, 
  Scale, Rocket, Droplet, ShieldCheck, ChevronLeft, Link2,
  FileText, Layout, Hash, Video, CheckSquare, RefreshCw, Zap, Activity
} from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const RELATIONSHIP_STATUS = [
  { id: 'Single', label: 'Single', icon: <User className="w-4 h-4" /> },
  { id: 'In a relationship', label: 'In a relationship', icon: <Heart className="w-4 h-4" /> },
  { id: 'Married', label: 'Married', icon: <Users className="w-4 h-4" /> },
  { id: 'Complicated', label: 'It’s complicated', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'Other', label: 'Other', icon: <Users className="w-4 h-4" /> },
];

const KIDS_OPTIONS = [0, 1, 2, 3, 4, 5]; // 5 represents 5+

const CAREERS = [
  { id: 'Student', icon: <GraduationCap className="w-5 h-5" />, label: 'Student' },
  { id: 'Healthcare', icon: <Stethoscope className="w-5 h-5" />, label: 'Healthcare' },
  { id: 'Finance', icon: <DollarSign className="w-5 h-5" />, label: 'Finance' },
  { id: 'Artist / Creative', icon: <Palette className="w-5 h-5" />, label: 'Creative' },
  { id: 'Tech / Engineering', icon: <Code className="w-5 h-5" />, label: 'Tech' },
  { id: 'Education', icon: <BookOpen className="w-5 h-5" />, label: 'Education' },
  { id: 'Business / Mgmt', icon: <Briefcase className="w-5 h-5" />, label: 'Business' },
  { id: 'Science', icon: <FlaskConical className="w-5 h-5" />, label: 'Science' },
  { id: 'Hospitality', icon: <ShoppingBag className="w-5 h-5" />, label: 'Hospitality' },
  { id: 'Law', icon: <Scale className="w-5 h-5" />, label: 'Law' },
  { id: 'Founder', icon: <Rocket className="w-5 h-5" />, label: 'Founder' },
];

// Refined Integrations List (Added Apple Fitness, Removed Apple Health)
const INTEGRATIONS = [
    { 
      id: 'Flo', 
      icon: <Droplet className="w-5 h-5" />, 
      color: 'bg-pink-500', 
      desc: 'Syncs cycle phases for better energy prediction.' 
    },
    { 
      id: 'Apple Fitness', 
      icon: <Activity className="w-5 h-5" />, 
      color: 'bg-red-500', 
      desc: 'Syncs activity rings, steps, and workouts.' 
    },
    { 
      id: 'TUM Online', 
      icon: <GraduationCap className="w-5 h-5" />, 
      color: 'bg-blue-600', 
      desc: 'Syncs university lectures, exams, and deadlines.' 
    },
    { 
      id: 'Notion', 
      icon: <FileText className="w-5 h-5" />, 
      color: 'bg-slate-800', 
      desc: 'Syncs tasks, project pages, and notes.' 
    },
    { 
      id: 'Slack', 
      icon: <Hash className="w-5 h-5" />, 
      color: 'bg-purple-600', 
      desc: 'Syncs work status and availability.' 
    },
    { 
      id: 'Microsoft Teams', 
      icon: <Users className="w-5 h-4" />, 
      color: 'bg-indigo-600', 
      desc: 'Syncs meetings and team calendar.' 
    },
    { 
      id: 'Zoom', 
      icon: <Video className="w-5 h-5" />, 
      color: 'bg-blue-500', 
      desc: 'Syncs scheduled video calls.' 
    },
];

const RoleButton = ({ role, isSelected, onToggle }: any) => (
  <button
    onClick={() => onToggle(role.id)}
    className={`relative h-28 p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md ${
        isSelected 
        ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/30' 
        : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-300 hover:text-emerald-800'
    }`}
  >
    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
        {role.icon}
    </div>
    <span className="font-bold text-xs text-center">{role.label}</span>
    {isSelected && (
      <div className="absolute top-2 right-2 bg-white text-emerald-600 rounded-full p-0.5">
        <Check className="w-3 h-3" />
      </div>
    )}
  </button>
);

export const OnboardingFlow: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: '',
    familyRoles: [],
    relationshipStatus: '',
    kidsCount: 0,
    careerRoles: [],
    hasCycle: false, // Default to false, enabling Flo sets this to true
    avatarSeed: 'Felix',
    connectedApps: [],
    isGoogleCalendarConnected: false
  });
  
  const [isGCalConnecting, setIsGCalConnecting] = useState(false);
  
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const toggleCareer = (id: string) => {
    setProfile(p => ({
        ...p,
        careerRoles: p.careerRoles.includes(id) ? p.careerRoles.filter(r => r !== id) : [...p.careerRoles, id]
    }));
  };

  const toggleApp = (id: string) => {
      setProfile(p => {
          const newApps = p.connectedApps?.includes(id) 
            ? p.connectedApps.filter(a => a !== id) 
            : [...(p.connectedApps || []), id];
          
          // Automatically set hasCycle if Flo is connected
          const newHasCycle = newApps.includes('Flo') ? true : p.hasCycle;

          return {
              ...p,
              connectedApps: newApps,
              hasCycle: newHasCycle
          };
      });
  }

  const handleConnectGCal = () => {
      setIsGCalConnecting(true);
      // Simulate OAuth flow
      setTimeout(() => {
          setIsGCalConnecting(false);
          setProfile(p => ({ ...p, isGoogleCalendarConnected: true }));
      }, 1500);
  };

  const finishOnboarding = () => {
    onComplete(profile);
  };

  const ageNum = parseInt(profile.age);
  const isAgeValid = !profile.age || (!isNaN(ageNum) && ageNum >= 14);
  const canProceedStep1 = profile.name && profile.age && !isNaN(ageNum) && ageNum >= 14;

  const TOTAL_STEPS = 5;

  const isAnythingConnected = profile.isGoogleCalendarConnected || (profile.connectedApps && profile.connectedApps.length > 0);

  return (
    <div className="max-w-4xl mx-auto min-h-[600px] h-full overflow-y-auto flex flex-col justify-center py-8 px-4">
        
        {/* BRAND LOGO HEADER */}
        <div className="flex justify-center mb-6 flex-shrink-0">
             <div className="flex items-center gap-3 p-2 px-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-white to-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-300">
                      <circle cx="12" cy="18" r="4" fill="currentColor" fillOpacity="0.8" />
                      <circle cx="12" cy="11" r="3" fill="currentColor" fillOpacity="0.9" />
                      <circle cx="12" cy="5.5" r="1.5" fill="currentColor" />
                   </svg>
                </div>
                <span className="font-serif text-2xl font-bold text-white tracking-tight drop-shadow-sm">Aion</span>
            </div>
        </div>

        {/* Header Progress */}
        <div className="flex items-center justify-between mb-8 px-2 flex-shrink-0">
            {step > 1 && step < TOTAL_STEPS ? (
                <button onClick={prevStep} className="p-2 hover:bg-white/20 bg-black/10 backdrop-blur-md rounded-full text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            ) : <div className="w-10"></div>}
            
            {step < TOTAL_STEPS && (
                <div className="flex gap-2">
                    {Array.from({length: TOTAL_STEPS - 1}, (_, i) => i + 1).map(i => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i <= step ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                    ))}
                </div>
            )}
            <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Main Card - Solid White */}
        <div className="bg-white border border-slate-200 shadow-2xl shadow-black/20 rounded-[48px] p-8 md:p-12 min-h-[500px] flex flex-col relative overflow-hidden max-h-[80vh]">
            
            {/* STEP 1: BIO */}
            {step === 1 && (
                <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-8 duration-500 overflow-y-auto">
                    <h2 className="text-4xl font-serif font-bold text-slate-900 mb-2">Let's get to know you.</h2>
                    <p className="text-slate-500 mb-8">We need the basics to calibrate your energy.</p>
                    
                    <div className="space-y-6 max-w-md">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">First Name</label>
                            <input 
                                type="text" 
                                value={profile.name}
                                onChange={e => setProfile({...profile, name: e.target.value})}
                                placeholder="e.g. Alex"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-lg font-medium focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Age</label>
                            <input 
                                type="number" 
                                value={profile.age}
                                onChange={e => setProfile({...profile, age: e.target.value})}
                                placeholder="e.g. 24"
                                className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-lg font-medium focus:outline-none transition-all ${!isAgeValid ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'}`}
                            />
                            {!isAgeValid && profile.age && (
                                <p className="text-red-500 text-xs font-bold mt-2 ml-2 flex items-center gap-1 animate-in slide-in-from-left-2">
                                    <ShieldCheck className="w-3 h-3" />
                                    You must be 14 or older to use Aion.
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        onClick={nextStep} 
                        disabled={!canProceedStep1}
                        className="mt-10 self-start px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* STEP 2: FAMILY CONTEXT (Split Sections) */}
            {step === 2 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 overflow-hidden">
                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex-shrink-0">Family Context</h2>
                    <p className="text-slate-500 mb-6 flex-shrink-0">Your home life sets your baseline energy.</p>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        
                        {/* A. Relationship Status */}
                        <div className="mb-8">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                                <Heart className="w-4 h-4" /> Relationship Status
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {RELATIONSHIP_STATUS.map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => setProfile({...profile, relationshipStatus: status.id})}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center ${
                                            profile.relationshipStatus === status.id
                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200 hover:text-emerald-800'
                                        }`}
                                    >
                                        {status.icon}
                                        <span className="text-xs font-bold">{status.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* B. Kids */}
                        <div>
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                                <Baby className="w-4 h-4" /> Do you have kids?
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                {KIDS_OPTIONS.map(count => (
                                    <button
                                        key={count}
                                        onClick={() => setProfile({...profile, kidsCount: count})}
                                        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all ${
                                            profile.kidsCount === count
                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg scale-110'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                                        }`}
                                    >
                                        {count === 5 ? '5+' : count}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                    
                    <button 
                        onClick={nextStep} 
                        disabled={!profile.relationshipStatus}
                        className="mt-8 self-end px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                    >
                        Continue <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

             {/* STEP 3: CAREER */}
             {step === 3 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 overflow-hidden">
                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex-shrink-0">Work & Study</h2>
                    <p className="text-slate-500 mb-8 flex-shrink-0">Where do you spend your focus hours?</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 content-start overflow-y-auto custom-scrollbar">
                        {CAREERS.map(role => (
                            <RoleButton 
                                key={role.id} 
                                role={role} 
                                isSelected={profile.careerRoles.includes(role.id)} 
                                onToggle={toggleCareer} 
                            />
                        ))}
                    </div>
                    
                    <button 
                        onClick={nextStep} 
                        disabled={profile.careerRoles.length === 0}
                        className="mt-8 self-end px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                    >
                        Continue <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* STEP 4: CONNECTED APPS */}
            {step === 4 && (
                 <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 overflow-hidden">
                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex-shrink-0">Connected Apps</h2>
                    <p className="text-slate-500 mb-6 flex-shrink-0">Sync your data to get personalized insights.</p>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                        {/* Google Calendar Section */}
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Google Calendar</h3>
                                        <p className="text-xs text-slate-500">Primary Schedule Sync</p>
                                    </div>
                                </div>
                                {profile.isGoogleCalendarConnected ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                        <Check className="w-3 h-3" /> Connected
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleConnectGCal}
                                        disabled={isGCalConnecting}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isGCalConnecting ? (
                                            <>
                                              <RefreshCw className="w-3 h-3 animate-spin" /> Connecting...
                                            </>
                                        ) : (
                                            'Connect'
                                        )}
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/50 p-2 rounded-lg">
                                <ShieldCheck className="w-3 h-3" />
                                Requires read/write permission to manage your events.
                            </p>
                        </div>

                        {/* Third Party Apps */}
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">Available Integrations</h3>
                        <div className="space-y-3 pb-4">
                            {INTEGRATIONS.map(app => {
                                const isSelected = profile.connectedApps?.includes(app.id);
                                return (
                                    <div
                                        key={app.id}
                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                            isSelected 
                                            ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                                            : 'border-slate-100 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${app.color}`}>
                                                {app.icon}
                                            </div>
                                            <div>
                                                <span className={`block text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{app.id}</span>
                                                <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-[200px] md:max-w-none">{app.desc}</p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => toggleApp(app.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                isSelected 
                                                ? 'bg-emerald-600 text-white' 
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        >
                                            {isSelected ? 'Synced' : 'Connect'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <button 
                        onClick={nextStep} 
                        className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                    >
                        Review & Finish <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
            )}

            {/* STEP 5: SUMMARY */}
            {step === 5 && (
                <div className="flex-1 flex flex-col justify-center items-center animate-in fade-in zoom-in duration-500 text-center overflow-y-auto">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600 shadow-lg shadow-emerald-200/50">
                        <Zap className="w-10 h-10 fill-current" />
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">{isAnythingConnected ? "You're Synced." : "Setup Complete."}</h2>
                    
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 max-w-md w-full mb-8">
                        <p className="text-slate-600 font-medium mb-2 leading-relaxed">
                            {isAnythingConnected ? "You are now connected to:" : "No external apps connected."}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                             {profile.isGoogleCalendarConnected && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">Google Calendar</span>}
                             {profile.connectedApps && profile.connectedApps.length > 0 ? (
                                 profile.connectedApps.map(app => (
                                     <span key={app} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">{app}</span>
                                 ))
                             ) : (
                                 !profile.isGoogleCalendarConnected && <span className="text-slate-400 text-sm">Your local profile is ready.</span>
                             )}
                        </div>
                        <div className="h-px bg-slate-200 my-3"></div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">
                            You can add more connections anytime in Settings.
                        </p>
                    </div>

                    <button 
                        onClick={finishOnboarding}
                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3 shadow-emerald-200"
                    >
                        Enter Dashboard <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

        </div>
    </div>
  );
};
