import { GoogleGenAI, Type } from "@google/genai";
import { CalendarEvent, EventSource, WellnessMetrics, BurnoutLevel } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Friendly Coach Logic ---

export const getCoachResponse = async (history: { role: string; text: string }[], userMessage: string) => {
  const ai = getAI();
  
  const systemInstruction = `
    You are Aion, a friendly and supportive wellness coach.
    Your goal is to help the user manage stress, workload, and burnout.
    
    Tone:
    - Use emojis occasionally 🌟.
    - Be empathetic but practical.
    - Adapt your advice based on the context they provide (e.g. if they talk about kids, speak like a supportive fellow parent; if school, like a mentor).
    - Focus on "balance" - ensuring they get work done but also rest.
    
    Keep responses encouraging and under 3 sentences unless asked for a detailed plan.
  `;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
  });

  const result = await chat.sendMessage({ message: userMessage });
  return result.text;
};

// --- Wellness & Day Planning Logic ---

export const analyzeWellnessAndPlan = async (metrics: WellnessMetrics): Promise<{
  burnoutLevel: string;
  burnoutScore: number;
  advice: string;
  scheduleItems: any[];
}> => {
  const ai = getAI();
  const rolesString = metrics.roles && metrics.roles.length > 0 ? metrics.roles.join(', ') : 'General User';

  const prompt = `
    Act as an expert wellness and productivity planner for a user who identifies as: ${rolesString}.
    Analyze this check-in data:
    
    - Sleep: ${metrics.sleepHours} hours
    - Stress (1-10): ${metrics.stressLevel}
    - Mood: ${metrics.mood}
    - Planned Focus/Work Hours: ${metrics.studyHoursPlanned}
    - Today's Deadlines: ${metrics.deadlines}
    - Other Obligations: ${metrics.obligations}

    Current Time: ${new Date().toLocaleTimeString()}

    Task:
    1. Calculate a "Burnout Risk Score" (0-100). 
       - Consider specific role stressors (e.g. Parents with low sleep is common but still high risk, Students with high deadlines and high stress is high risk).
    2. Assign a level: Low, Medium, High.
    3. Write a short, motivational "Vibe Check" (Advice) addressing their specific roles and current state.
    4. Create a simple daily schedule for the rest of the day. 
       - It MUST include the focus hours they mentioned.
       - It MUST include breaks and wellness tailored to their roles (e.g. "Play time" for parents/kids, "Stretch" for desk workers).
       - If Burnout is High, prioritize rest.
    
    Return JSON only.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          burnoutLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          burnoutScore: { type: Type.NUMBER },
          advice: { type: Type.STRING },
          scheduleItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING, enum: ["SCHOOL", "WELLNESS", "SOCIAL"] },
                startOffsetHours: { type: Type.NUMBER, description: "Hour of day (0-24)" },
                durationMinutes: { type: Type.NUMBER },
                description: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Aion");
  
  return JSON.parse(text);
};
