
import React, { useState } from 'react';
import { 
  Briefcase, GraduationCap, Baby, Palette, Plus, Check, 
  Code, Stethoscope, BookOpen, User, Heart, Users, Gem, 
  UserMinus, PawPrint, DollarSign, HelpCircle,
  FlaskConical, ShoppingBag, Scale, Rocket, ArrowRight,
  Coffee, Sunset
} from 'lucide-react';

interface Props {
  onComplete: (roles: string[]) => void;
}

const FAMILY_STATUS = [
  { id: 'Single', icon: <User className="w-5 h-5" />, label: 'Single' },
  { id: 'In a relationship', icon: <Heart className="w-5 h-5" />, label: 'Partnered' },
  { id: 'Married', icon: <Users className="w-5 h-5" />, label: 'Married' },
  { id: 'Engaged', icon: <Gem className="w-5 h-5" />, label: 'Engaged' },
  { id: 'Parent', icon: <Baby className="w-5 h-5" />, label: 'Parent' },
  { id: 'Pet Parent', icon: <PawPrint className="w-5 h-5" />, label: 'Pet Parent' },
  { id: 'Other Family', icon: <HelpCircle className="w-5 h-5" />, label: 'Other' },
];

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
  { id: 'No job', icon: <UserMinus className="w-5 h-5" />, label: 'No Job' },
  { id: 'Retired', icon: <Sunset className="w-5 h-5" />, label: 'Retired' },
  { id: 'Other Career', icon: <HelpCircle className="w-5 h-5" />, label: 'Other' },
];

interface RoleButtonProps {
  role: { id: string; icon: React.ReactNode; label: string };
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const RoleButton: React.FC<RoleButtonProps> = ({ role, isSelected, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(role.id)}
      className={`relative h-32 p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group shadow-sm hover:shadow-xl hover:scale-105 backdrop-blur-sm ${
          isSelected 
          ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/30' 
          : 'bg-white/80 border-white text-slate-500 hover:border-emerald-300 hover:text-emerald-800'
      }`}
    >
      <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
          {role.icon}
      </div>
      <span className={`font-bold text-xs tracking-wide text-center ${isSelected ? 'text-white' : 'text-slate-600'}`}>
        {role.label}
      </span>
      {isSelected && (
        <div className="absolute top-3 right-3 bg-white text-emerald-600 rounded-full p-1 shadow-sm animate-in zoom-in duration-200">
          <Check className="w-3 h-3" />
        </div>
      )}
    </button>
  );
};

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

  const isValid = selectedRoles.length > 0;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col py-4">
      
      <div className="mb-8 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 tracking-tight drop-shadow-sm">
            Find Your <span className="text-emerald-600">Balance.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
             Select the roles that take up your energy. We'll help you manage them.
          </p>
      </div>

      <div className="flex-1 bg-white/30 backdrop-blur-xl rounded-[48px] border border-white/60 p-6 md:p-12 shadow-2xl shadow-emerald-900/5 overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-12">
            {/* Family Status Section */}
            <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 pl-2 border-l-4 border-rose-400 flex items-center gap-3">
                <span className="text-slate-800">Life Context</span>
                <span className="h-px flex-1 bg-slate-200/50"></span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {FAMILY_STATUS.map((role) => (
                <RoleButton 
                    key={role.id} 
                    role={role} 
                    isSelected={selectedRoles.includes(role.id)}
                    onToggle={toggleRole}
                />
                ))}
            </div>
            </div>

            {/* Careers Section */}
            <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 pl-2 border-l-4 border-emerald-400 flex items-center gap-3">
                <span className="text-slate-800">Work & Study</span>
                <span className="h-px flex-1 bg-slate-200/50"></span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {CAREERS.map((role) => (
                <RoleButton 
                    key={role.id} 
                    role={role} 
                    isSelected={selectedRoles.includes(role.id)}
                    onToggle={toggleRole}
                />
                ))}
            </div>
            </div>

            {/* Custom Input */}
            <div className="flex items-center justify-center pb-4">
                <div className="bg-white rounded-2xl p-2 pl-6 flex items-center gap-3 shadow-xl shadow-slate-200/50 border border-white/50 w-full max-w-md">
                <input 
                    type="text" 
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomRole()}
                    placeholder="Something else? (e.g. Marathon Runner)"
                    className="bg-transparent border-none text-slate-800 placeholder-slate-400 flex-1 focus:ring-0 text-sm font-medium"
                />
                <button 
                    onClick={addCustomRole}
                    className="p-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl transition-colors shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                </button>
                </div>
            </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                 {selectedRoles.length > 0 ? (
                    selectedRoles.map(role => (
                        <span key={role} className="px-4 py-2 bg-slate-800 text-white rounded-full text-xs font-bold shadow-md animate-in fade-in zoom-in">
                            {role}
                        </span>
                    ))
                 ) : (
                     <span className="text-slate-400 text-sm italic font-medium">Select at least one role to begin...</span>
                 )}
            </div>
            <button
                onClick={() => onComplete(selectedRoles)}
                disabled={!isValid}
                className="bg-slate-900 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed px-10 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-slate-300 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 w-full md:w-auto justify-center"
            >
                Generate Plan <ArrowRight className="w-5 h-5" />
            </button>
        </div>

      </div>
    </div>
  );
};
