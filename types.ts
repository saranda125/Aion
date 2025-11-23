

export enum EventSource {
  SCHOOL = 'School/Study',
  WELLNESS = 'Health & Chill',
  SOCIAL = 'Social/Fun',
  AION_AI = 'Aion Plan',
  GOOGLE = 'Google Calendar',
  HEALTH = 'Health & Fitness',
  FLO = 'Flo',
  TUM = 'Tum'
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  source: EventSource;
  description?: string;
  location?: string; // New field for tooltip
  color?: string;
  isFixed: boolean;
  status?: 'planned' | 'completed' | 'missed';
  workoutType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type Mood = 'Great' | 'Okay' | 'Stressed' | 'Tired' | 'Anxious';

export interface UserProfile {
  name: string;
  age: string;
  hasCycle: boolean;
  familyRoles: string[]; // Deprecated in UI, kept for type safety if needed
  relationshipStatus?: string; // New
  kidsCount?: number; // New
  careerRoles: string[];
  avatarSeed: string;
  connectedApps?: string[];
  isGoogleCalendarConnected?: boolean;
}

export interface WellnessMetrics {
  sleepHours: number;
  stressLevel: number; // 1-10
  mood: Mood;
  customActivity?: string;
}

export enum BurnoutLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export type SuggestionType = 'warning' | 'optimization' | 'opportunity' | 'insight';
export type Priority = 'High' | 'Medium' | 'Low';

export interface DailySuggestion {
  id: string;
  title: string;
  description: string;
  type: SuggestionType;
  priority: Priority;
  timeSlot?: string;
}

export interface DayAnalysis {
  burnoutLevel: BurnoutLevel;
  burnoutScore: number; // 0-100
  advice: string;
  schedule: CalendarEvent[];
  suggestions: DailySuggestion[];
}

export type Persona = 'Toxic Motivation' | 'Softer / Empathetic' | 'Neutral / Stoic';