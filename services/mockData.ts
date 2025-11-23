

import { CalendarEvent, EventSource } from '../types';

// Helper to create dates relative to today
const getRelativeDate = (daysOffset: number, hour: number, minute: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const generateWeeklyEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  // 1. Google Calendar (Orange) - Exact Requested Placeholders
  events.push(
    {
      id: 'g-1',
      title: 'Go to dentist at 3',
      start: getRelativeDate(0, 15, 0), // Today 3 PM
      end: getRelativeDate(0, 16, 0),
      source: EventSource.GOOGLE,
      color: 'bg-orange-500',
      isFixed: true,
      location: 'Dr. Smith Clinic',
      description: 'Routine checkup.'
    },
    {
      id: 'g-2',
      title: 'Meeting at 5',
      start: getRelativeDate(0, 17, 0), // Today 5 PM
      end: getRelativeDate(0, 18, 0),
      source: EventSource.GOOGLE,
      color: 'bg-orange-500',
      isFixed: true,
      location: 'Conference Room B',
      description: 'Project Sync.'
    }
  );

  // 2. TUM / University (Blue) - Exact Requested Placeholders
  events.push(
    {
      id: 'tum-1',
      title: 'Lecture in Garching at 11',
      start: getRelativeDate(0, 11, 0), // Today 11 AM
      end: getRelativeDate(0, 12, 30),
      source: EventSource.TUM,
      color: 'bg-blue-600',
      isFixed: true,
      location: 'Garching',
      description: 'Informatics 101'
    },
    {
      id: 'tum-2',
      title: 'Seminar in Main Campus at 6',
      start: getRelativeDate(0, 18, 0), // Today 6 PM (18:00)
      end: getRelativeDate(0, 19, 30),
      source: EventSource.TUM,
      color: 'bg-blue-600',
      isFixed: true,
      location: 'Main Campus',
      description: 'Advanced Topics Seminar'
    }
  );

  // 3. Flo (Light Pink) - 5 Day Period Block
  // We create a continuous block relative to today (assuming user is in cycle)
  const today = new Date();
  const startCycle = new Date(today);
  startCycle.setDate(today.getDate() - 1); // Started yesterday
  startCycle.setHours(0,0,0,0);
  
  const endCycle = new Date(startCycle);
  endCycle.setDate(startCycle.getDate() + 5); // 5 days total
  endCycle.setHours(23,59,59,999);

  events.push(
    {
      id: 'flo-period',
      title: 'Period (Day 2)',
      start: startCycle, // Multi-day event
      end: endCycle,
      source: EventSource.FLO,
      color: 'bg-pink-200',
      isFixed: true,
      description: 'Menstruation phase.'
    }
  );

  // 4. Workout History (Body & Rhythm) - Past Events
  events.push(
    // Completed run yesterday
    {
      id: 'w-past-1',
      title: 'Morning Run',
      start: getRelativeDate(-1, 7, 0),
      end: getRelativeDate(-1, 7, 45),
      source: EventSource.HEALTH,
      workoutType: 'running',
      status: 'completed',
      isFixed: true,
      location: 'Park',
      color: 'bg-red-500' 
    },
    // Missed yoga session 2 days ago
    {
      id: 'w-past-2',
      title: 'Evening Yoga',
      start: getRelativeDate(-2, 19, 0),
      end: getRelativeDate(-2, 20, 0),
      source: EventSource.HEALTH,
      workoutType: 'yoga',
      status: 'missed',
      isFixed: true,
      location: 'Living Room',
      color: 'bg-red-500'
    },
    // Completed strength session 3 days ago
    {
      id: 'w-past-3',
      title: 'Upper Body Power',
      start: getRelativeDate(-3, 18, 0),
      end: getRelativeDate(-3, 19, 0),
      source: EventSource.HEALTH,
      workoutType: 'upper',
      status: 'completed',
      isFixed: true,
      location: 'Gym',
      color: 'bg-red-500'
    },
     // Missed run 4 days ago
    {
        id: 'w-past-4',
        title: '5k Run',
        start: getRelativeDate(-4, 7, 0),
        end: getRelativeDate(-4, 7, 45),
        source: EventSource.HEALTH,
        workoutType: 'running',
        status: 'missed',
        isFixed: true,
        location: 'Outdoors',
        color: 'bg-red-500'
    }
  );

  return events;
};