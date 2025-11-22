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

  // 1. Google Calendar (Work/Fixed)
  events.push(
    {
      id: 'g-1',
      title: 'Weekly Team Sync',
      start: getRelativeDate(0, 10, 0),
      end: getRelativeDate(0, 11, 0),
      source: EventSource.GOOGLE,
      color: 'bg-blue-500',
      isFixed: true,
      description: 'Sync with design and eng team.'
    },
    {
      id: 'g-2',
      title: 'Client Presentation',
      start: getRelativeDate(1, 14, 0),
      end: getRelativeDate(1, 15, 30),
      source: EventSource.GOOGLE,
      color: 'bg-blue-500',
      isFixed: true,
    },
    {
      id: 'g-3',
      title: 'Deep Work Block',
      start: getRelativeDate(2, 9, 0),
      end: getRelativeDate(2, 12, 0),
      source: EventSource.GOOGLE,
      color: 'bg-blue-600',
      isFixed: false,
    }
  );

  // 2. Health & Fitness (Fixed & Flexible)
  events.push(
    {
      id: 'h-1',
      title: 'Morning Run (5k)',
      start: getRelativeDate(0, 7, 0),
      end: getRelativeDate(0, 8, 0),
      source: EventSource.HEALTH,
      color: 'bg-rose-500',
      isFixed: false,
    },
    {
      id: 'h-2',
      title: 'Yoga Class',
      start: getRelativeDate(2, 18, 0),
      end: getRelativeDate(2, 19, 0),
      source: EventSource.HEALTH,
      color: 'bg-rose-500',
      isFixed: true,
    }
  );

  // 3. Flo (Period Tracking / Cycle Phase) - Represented as all-day indicators or specific reminders
  events.push(
    {
      id: 'f-1',
      title: 'Luteal Phase - High Energy',
      start: getRelativeDate(0, 0, 0),
      end: getRelativeDate(0, 23, 59),
      source: EventSource.FLO,
      color: 'bg-pink-500',
      isFixed: true,
      description: 'Good time for strength training.'
    },
    {
      id: 'f-2',
      title: 'Cycle Start Forecast',
      start: getRelativeDate(3, 0, 0),
      end: getRelativeDate(3, 23, 59),
      source: EventSource.FLO,
      color: 'bg-pink-600',
      isFixed: true,
      description: 'Expect lower energy levels. Prioritize rest.'
    }
  );

  // 4. Tum (Habits/Meditation)
  events.push(
    {
      id: 't-1',
      title: 'Mindfulness',
      start: getRelativeDate(0, 21, 0),
      end: getRelativeDate(0, 21, 30),
      source: EventSource.TUM,
      color: 'bg-amber-500',
      isFixed: false,
    },
    {
      id: 't-2',
      title: 'Reading Habit',
      start: getRelativeDate(1, 20, 0),
      end: getRelativeDate(1, 20, 45),
      source: EventSource.TUM,
      color: 'bg-amber-500',
      isFixed: false,
    }
  );

  return events;
};