import React, { useState } from 'react';
import { Briefcase, GraduationCap, Baby, Palette, Dumbbell, Plus, Check } from 'lucide-react';

interface Props {
  onComplete: (roles: string[]) => void;
}

const PREDEFINED_ROLES = [
  { id: 'Student', icon: <GraduationCap className="w-6 h-6" />, label: 'Student' },
  { id: 'Professional', icon: <Briefcase className="w-6 h-6" />, label: 'Professional' },
  { id: 'Parent', icon: <Baby className="w-6 h-6" />, label: 'Parent' },
  { id: 'Creative', icon: <Palette className="w-6 h-6" />, label: 'Creative' },
  { id: 'Athlete', icon: <Dumbbell className="w-6 h-6" />, label: 'Athlete' },
];

export const RoleSelection: React.FC<Props> = ({ onComplete }) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState('');

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const addCustomRole = () => {
    if (customRole.trim() && !selectedRoles.includes(customRole.trim())) {
      setSelectedRoles([...selectedRoles, customRole.trim()]);
      setCustomRole('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
          Who are you today?
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Aion adapts to your life. Select the roles that define your current focus to get personalized wellness and schedule advice.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
        {PREDEFINED_ROLES.map((role) => {
            const isSelected = selectedRoles.includes(role.id);
            return (
                <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`relative p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-4 group shadow-sm hover:shadow-md ${
                        isSelected 
                        ? 'bg-aion-primary border-aion-primary text-white shadow-emerald-200 transform scale-105' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                >
                    <div className={`p-4 rounded-2xl transition-colors ${isSelected ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-white text-slate-700'}`}>
                        {role.icon}
                    </div>
                    <span className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {role.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-white text-aion-primary rounded-full p-1 shadow-sm">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                </button>
            )
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center gap-3 mb-12 shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-aion-primary transition-all">
        <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
            <Plus className="w-5 h-5" />
        </div>
        <input 
            type="text" 
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomRole()}
            placeholder="Add another role (e.g. Freelancer, Gamer, Volunteer)..."
            className="bg-transparent border-none text-slate-800 placeholder-slate-400 flex-1 focus:ring-0 text-lg"
        />
        {customRole && (
             <button 
                onClick={addCustomRole}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
             >
                Add
             </button>
        )}
      </div>

      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {selectedRoles.map(role => (
                <span key={role} className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    {role}
                    <button onClick={() => toggleRole(role)} className="hover:text-emerald-900 rounded-full hover:bg-emerald-200/50 p-0.5"><Plus className="w-3 h-3 rotate-45" /></button>
                </span>
            ))}
        </div>
      )}

      <div className="text-center">
        <button
            onClick={() => onComplete(selectedRoles)}
            disabled={selectedRoles.length === 0}
            className="bg-aion-primary hover:bg-emerald-700 text-white disabled:opacity-50 disabled:hover:bg-aion-primary px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all transform hover:scale-[1.02] active:scale-95"
        >
            Continue to Check-in
        </button>
      </div>
    </div>
  );
};