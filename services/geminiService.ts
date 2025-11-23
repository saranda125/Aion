

import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WellnessMetrics, Persona } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Friendly Coach Logic ---

export const getCoachResponse = async (history: { role: string; text: string }[], userMessage: string, persona: Persona = 'Neutral / Stoic') => {
  const ai = getAI();
  
  let personaInstruction = "";
  if (persona === 'Toxic Motivation') {
      personaInstruction = `
        You are a "Toxic Motivation" coach. 
        Style: AGGRESSIVE, MILITARISTIC, BLUNT.
        Beliefs: Sleep is for when you're dead. Excuses are for the weak. Pain is weakness leaving the body.
        Phrases: "STAY HARD", "NO EXCUSES", "GRIND", "DO IT ANYWAY", "GET AFTER IT".
        Tone: USE CAPS LOCK FREQUENTLY. Be demanding. Do not be nice.
        Goal: Push the user to their absolute limit. Shame them slightly for laziness.
      `;
  } else if (persona === 'Softer / Empathetic') {
      personaInstruction = `
        You are a "Softer / Empathetic" coach.
        Style: Gentle, validating, warm, soothing, therapist-like.
        Beliefs: Your worth is not your productivity. Rest is a vital part of the process. Listen to your body.
        Phrases: "It's okay to pause", "Breathe with me", "You are doing enough", "Be gentle with yourself".
        Tone: Lowercase aesthetic, soft, kind, loving.
        Goal: Prioritize mental health and emotional stability. Make them feel safe.
      `;
  } else {
      personaInstruction = `
        You are Aion, a friendly and supportive wellness coach (Neutral / Stoic).
        Style: Balanced, practical, calm.
        Beliefs: Balance is key, consistency over intensity.
        Goal: Help the user manage stress and burnout effectively.
      `;
  }

  const systemInstruction = `
    ${personaInstruction}
    Your goal is to help the user manage stress, workload, and burnout.
    Keep responses under 3 sentences unless asked for a detailed plan.
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

// --- Weather Logic ---

export const getLocalWeather = async (lat: number, lon: number) => {
  const ai = getAI();

  try {
    // 1. Fetch raw data from Open-Meteo (Free, No Key required)
    // Added: Daily variables for sunrise, sunset, and UV index
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=sunrise,sunset,uv_index_max&timezone=auto`
    );
    
    if (!weatherRes.ok) throw new Error("Weather API failed");
    
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const daily = weatherData.daily || {};

    // 2. Attempt Reverse Geocoding for City Name
    let locationName = "Local Area";
    try {
        const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
            { headers: { 'User-Agent': 'AionWellnessApp/1.0' } }
        );
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            locationName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || "Your Location";
        }
    } catch (e) {
        console.warn("Geo lookup failed, defaulting location name.");
    }

    // 3. Use AI to interpret the raw data into the App's JSON format
    // We pass the UV and Solar data to the prompt so the vibe check is accurate.
    const prompt = `
      You are a weather reporter for the Aion wellness app.
      
      REAL-TIME DATA from Open-Meteo:
      - Location Name: ${locationName}
      - Temperature: ${current.temperature_2m}°C
      - Wind Speed: ${current.wind_speed_10m} km/h
      - Humidity: ${current.relative_humidity_2m}%
      - UV Index Max: ${daily.uv_index_max?.[0] || 'Unknown'}
      - WMO Weather Code: ${current.weather_code} (0=Clear, 1-3=Cloudy, 45-48=Fog, 51-67=Rain, 71-77=Snow, 95+=Storm)

      OUTPUT: A JSON object matching this schema exactly.
      {
        "location": "${locationName}",
        "temp": "${current.temperature_2m}", 
        "condition": "Short text description of the WMO code",
        "wmo_code": ${current.weather_code},
        "wind": "${current.wind_speed_10m} km/h",
        "humidity": "${current.relative_humidity_2m}%",
        "uv_index": "${daily.uv_index_max?.[0] || 0}",
        "sunrise": "${daily.sunrise?.[0]?.split('T')[1] || '06:00'}",
        "sunset": "${daily.sunset?.[0]?.split('T')[1] || '18:00'}",
        "recommendation": "Short, vibe-based outfit advice (max 6 words)",
        "clothing_top": "Specific top (e.g. 'Hoodie', 'T-Shirt')",
        "clothing_shoes": "Specific shoes (e.g. 'Boots', 'Sneakers')"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const data = JSON.parse(text);

    // Return in the format expected by the UI
    return {
        data: data,
        sources: [{ uri: "https://open-meteo.com/", title: "Open-Meteo Weather API" }]
    };

  } catch (error) {
    console.error("Weather Service Error:", error);
    // Fallback if API fails completely
    return {
        data: {
            location: "Offline",
            temp: "--",
            condition: "Unavailable",
            wmo_code: 3,
            wind: "--",
            humidity: "--",
            uv_index: "0",
            sunrise: "--:--",
            sunset: "--:--",
            recommendation: "Look outside!",
            clothing_top: "Layers",
            clothing_shoes: "Comfy shoes"
        },
        sources: []
    };
  }
};

// --- Wellness & Day Planning Logic ---

export const analyzeWellnessAndPlan = async (profile: UserProfile, metrics: WellnessMetrics, persona: Persona): Promise<{
  burnoutLevel: string;
  burnoutScore: number;
  advice: string;
  scheduleItems: any[];
  suggestions: any[];
}> => {
  const ai = getAI();
  
  const careerRoles = profile.careerRoles?.join(', ') || 'None';
  const kidsCount = profile.kidsCount || 0;
  const relationshipStatus = profile.relationshipStatus || 'Single';
  
  let vibeInstruction = "";
  if (persona === 'Toxic Motivation') {
      vibeInstruction = "VIBE CHECK TONE: AGGRESSIVE DRILL SERGEANT. COMMAND THE USER. Use CAPS. Insult their laziness (playfully but harsh).";
  } else if (persona === 'Softer / Empathetic') {
      vibeInstruction = "VIBE CHECK TONE: Gentle, loving, maternal. Use words like 'honey', 'sweetheart', 'rest', 'breathe'. Prioritize their feelings over productivity.";
  } else {
      vibeInstruction = "VIBE CHECK TONE: Practical and Stoic. Focus on facts and balance. No fluff.";
  }

  // --- STRESS & LOAD LOGIC FOR AI ---
  const logicInstruction = `
    CALCULATION LOGIC FOR STRESS & LOAD:
    1. KIDS: 
       - 0 Kids: Low Load Baseline.
       - 1 Kid: Moderate Load.
       - 2-3 Kids: High Load.
       - 4+ Kids: EXTREME LOAD.
       - Single Parent (Kids > 0 AND Status == 'Single'): CRITICAL STRESS FACTOR (+20% burnout risk).
    
    2. CAREER:
       - Healthcare / Doctor: High Stress.
       - Finance / Tech / Law: Medium-High Stress.
       - Creative / Artist: Lower Stress Baseline (usually).
       - Student: Variable (Check Age. If < 22, assume Exam stress).

    3. RELATIONSHIP:
       - 'In a relationship' / 'Married': User has less "Me Time". Factor in quality time suggestions.
       - 'Single': More "Me Time" potentially available, but maybe higher loneliness (Social suggestion).

    4. BIOMETRICS:
       - Sleep < 6h: +30% Burnout Risk. Suggestions MUST be restorative (Nap, Yoga Nidra).
       - Stress > 7: IMMEDIATE INTERVENTION. No High Intensity Workouts.
  `;

  const prompt = `
    Act as an expert wellness and productivity planner for a user named ${profile.name}.
    
    USER PROFILE:
    - Age: ${profile.age}
    - Relationship Status: ${relationshipStatus}
    - Kids: ${kidsCount}
    - Career: ${careerRoles}
    - Cycle Tracking: ${profile.hasCycle ? 'Yes (Consider Phase)' : 'No'}

    CHECK-IN DATA (Now: ${new Date().toLocaleTimeString()}):
    - Sleep: ${metrics.sleepHours} hours
    - Stress (1-10): ${metrics.stressLevel}
    - Mood: ${metrics.mood}
    - Top of Mind: ${metrics.customActivity || 'None'}

    Persona Mode: ${persona}

    ${logicInstruction}

    Task:
    1. Calculate "Burnout Risk Score" (0-100) using the Logic above.
    2. Assign level: Low, Medium, High.
    3. Write a short "Vibe Check" (Advice). ${vibeInstruction}
    4. Create specific Smart Suggestions.
       - **Context Aware**: 
         - Example: "Single Parent with 3 kids" -> Suggest "10-min micro-break" (Realistic). 
         - Example: "Student" -> Suggest "Pomodoro Study Block".
       - **Visual Type**: Assign a type ('warning', 'optimization', 'opportunity', 'insight').
    5. Generate a schedule plan (optional items to add).

    Return JSON only matching the schema.
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
                dayOffset: { type: Type.NUMBER, description: "0 for today, 1 for tomorrow" },
                startOffsetHours: { type: Type.NUMBER, description: "Hour of day (0-24)" },
                durationMinutes: { type: Type.NUMBER },
                description: { type: Type.STRING }
              }
            }
          },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["warning", "optimization", "opportunity", "insight"] },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                timeSlot: { type: Type.STRING }
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