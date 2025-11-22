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
  color?: string;
  isFixed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type Mood = 'Great' | 'Okay' | 'Stressed' | 'Tired' | 'Anxious';

export interface WellnessMetrics {
  roles: string[];
  sleepHours: number;
  stressLevel: number; // 1-10
  mood: Mood;
  studyHoursPlanned: number;
  deadlines: string; // Free text description
  obligations: string; // Free text
}

export enum BurnoutLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface DayAnalysis {
  burnoutLevel: BurnoutLevel;
  burnoutScore: number; // 0-100
  advice: string;
  schedule: CalendarEvent[];
}
