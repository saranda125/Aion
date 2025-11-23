
import React, { useState } from 'react';
import { UserProfile, Persona } from '../types';
import { X, User, Settings, Shield, LogOut, ChevronRight, Check, Link2, AlertCircle, Heart, Activity, Droplet, GraduationCap, FileText, Hash, Users, Video, RefreshCw, Lock } from 'lucide-react';

interface Props {
  profile: UserProfile;
  persona: Persona;
  onClose: () => void;
  onUpdateProfile: (p: UserProfile) => void;
  onUpdatePersona: (p: Persona) => void;
}

const AVATARS = ['Felix', 'Aneka', 'Milo', 'Bella', 'Leo', 'Zoe'];
const PERSONAS: Persona[] = ['Neutral / Stoic', 'Toxic Motivation', 'Softer / Empathetic'];

// Shared integration list - Updated (Apple Fitness added, Apple Health removed)
const INTEGRATIONS = [
    { 
      id: 'Flo', 
      icon: <Droplet className="w-4 h-4" />, 
      color: 'bg-pink-500', 
      desc: 'Syncs cycle phases for better energy prediction.' 
    },
    { 
      id: 'Apple Fitness', 
      icon: <Activity className="w-4 h-4" />, 
      color: 'bg-red-500', 
      desc: 'Syncs activity rings, steps, and workouts.' 
    },
    { 
      id: 'TUM Online', 
      icon: <GraduationCap className="w-4 h-4" />, 
      color: 'bg-blue-600', 
      desc: 'Syncs university lectures, exams, and deadlines.' 
    },
    { 
      id: 'Notion', 
      icon: <FileText className="w-4 h-4" />, 
      color: 'bg-slate-800', 
      desc: 'Syncs tasks, project pages, and notes.' 
    },
    { 
      id: 'Slack', 
      icon: <Hash className="w-4 h-4" />, 
      color: 'bg-purple-600', 
      desc: 'Syncs work status and availability.' 
    },
    { 
      id: 'Microsoft Teams', 
      icon: <Users className="w-4 h-4" />, 
      color: 'bg-indigo-600', 
      desc: 'Syncs meetings and team calendar.' 
    },
    { 
      id: 'Zoom', 
      icon: <Video className="w-4 h-4" />, 
      color: 'bg-blue-500', 
      desc: 'Syncs scheduled video calls.' 
    },
];

export const ProfileSettings: React.FC<Props> = ({ profile, persona, onClose, onUpdateProfile, onUpdatePersona }) => {
  const [authError, setAuthError] = useState<string | null>(null);

  // Simulated Auth Check
  const isAuthenticated = !!profile.name;

  const handleToggleApp = (id: string) => {
      if (!isAuthenticated) {
          setAuthError(`Sign in to connect ${id}`);
          setTimeout(() => setAuthError(null), 3000);
          return;
      }

      const newApps = profile.connectedApps?.includes(id) 
        ? profile.connectedApps.filter(a => a !== id) 
        : [...(profile.connectedApps || []), id];
      
      // If Flo is toggled, update cycle tracking preference
      const newHasCycle = newApps.includes('Flo') ? true : (id === 'Flo' ? false : profile.hasCycle);

      onUpdateProfile({
          ...profile,
          connectedApps: newApps,
          hasCycle: newHasCycle
      });
  };

  const handleToggleGoogle = () => {
      if (!isAuthenticated) {
          setAuthError("Sign in to sync Calendar");
          setTimeout(() => setAuthError(null), 3000);
          return;
      }
      onUpdateProfile({...profile, isGoogleCalendarConnected: !profile.isGoogleCalendarConnected});
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-2xl font-serif font-bold text-slate-800">Profile & Settings</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <X className="w-5 h-5" />
            </button>
        </div>

        {authError && (
            <div className="bg-red-50 border-b border-red-100 px-8 py-2 flex justify-center animate-in slide-in-from-top-2">
                <p className="text-xs font-bold text-red-500 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> {authError}
                </p>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            {/* Avatar Section */}
            <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Identity</h3>
                <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-emerald-50 p-1 border-2 border-emerald-100 shadow-sm relative group">
                            <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`} 
                                alt="Avatar" 
                                className="w-full h-full rounded-full bg-white"
                            />
                             <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-slate-100">
                                <RefreshCw className="w-3 h-3 text-slate-400" />
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Display Name</label>
                             <input 
                                type="text" 
                                value={profile.name} 
                                onChange={(e) => onUpdateProfile({...profile, name: e.target.value})}
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-emerald-400"
                             />
                         </div>
                         
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Custom Avatar</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text"
                                    value={profile.avatarSeed}
                                    onChange={(e) => onUpdateProfile({...profile, avatarSeed: e.target.value})}
                                    placeholder="Type any emoji (e.g., 👾) or name..."
                                    className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {AVATARS.map(seed => (
                                    <button 
                                        key={seed}
                                        onClick={() => onUpdateProfile({...profile, avatarSeed: seed})}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${profile.avatarSeed === seed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {seed}
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            </section>

             {/* Integrations Section */}
             <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Connected Apps</h3>
                <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    
                    {/* Google Calendar Status */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <Link2 className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block font-bold text-sm text-slate-700">Google Calendar</span>
                                <span className="text-[10px] text-slate-400">Primary Schedule Sync</span>
                            </div>
                        </div>
                        {profile.isGoogleCalendarConnected ? (
                            <button onClick={handleToggleGoogle} className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-red-100 hover:text-red-600 transition-colors">
                                <Check className="w-3 h-3" /> Connected
                            </button>
                        ) : (
                            <button onClick={handleToggleGoogle} className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 hover:text-blue-600 transition-colors flex items-center gap-1">
                                {isAuthenticated ? 'Connect' : <Lock className="w-3 h-3" />}
                                {isAuthenticated ? '' : 'Sign In'}
                            </button>
                        )}
                    </div>

                    {/* Integration List */}
                    {INTEGRATIONS.map(app => {
                         const isSelected = profile.connectedApps?.includes(app.id);
                         return (
                            <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 text-white rounded-lg flex items-center justify-center flex-shrink-0 ${app.color}`}>
                                        {app.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block font-bold text-sm text-slate-700 truncate">{app.id}</span>
                                        <span className="block text-[10px] text-slate-400 truncate max-w-[150px] sm:max-w-xs">{app.desc}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleToggleApp(app.id)}
                                    className={`ml-2 text-[10px] px-3 py-1.5 rounded-lg font-bold flex-shrink-0 transition-colors flex items-center gap-1 ${
                                        isSelected 
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
                                    }`}
                                >
                                    {isSelected ? 'Synced' : (isAuthenticated ? 'Connect' : <Lock className="w-3 h-3" />)}
                                </button>
                            </div>
                         );
                    })}

                </div>
            </section>

            {/* Coach Settings */}
            <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Aion Coach Personality</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PERSONAS.map(p => (
                        <button
                            key={p}
                            onClick={() => onUpdatePersona(p)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                persona === p 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                                : 'border-slate-100 bg-white text-slate-600 hover:border-emerald-200'
                            }`}
                        >
                            <span className="block font-bold text-sm mb-1">{p.split('/')[0]}</span>
                            <span className="text-xs opacity-70 uppercase tracking-wider">{p.split('/')[1] || 'Default'}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* General Settings Links */}
            <section>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Account</h3>
                <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">General Preferences</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">Privacy & Data</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors group mt-4">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-rose-400 group-hover:text-rose-600" />
                            <span className="text-sm font-medium text-rose-700">Sign Out</span>
                        </div>
                    </button>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};
