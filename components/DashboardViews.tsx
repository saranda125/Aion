

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Coffee, Trees, CloudRain, CloudSun, Wind, Thermometer, Move, Flame, Trophy, Play, Pause, RotateCcw, ExternalLink, Heart, Activity, Droplet, Timer, Loader2, Moon, Sun, Sunrise, Cloud, CheckCircle, X, Plus, Zap, Sparkles, ChevronRight, Calendar, BarChart3, AlertCircle, Utensils, Dumbbell, ShoppingCart, Navigation, Wind as WindIcon, Trash2, ArrowLeft, ChevronLeft, Shirt, Umbrella, Footprints, Bike, Flower, TrendingUp, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Sunset, Gauge, CalendarDays, PenTool, ArrowRight, XCircle, Check } from 'lucide-react';
import { getLocalWeather } from '../services/geminiService';
import { Persona, UserProfile, WellnessMetrics, DayAnalysis, CalendarEvent, EventSource } from '../types';

interface ViewProps {
    persona?: Persona;
    profile?: UserProfile;
    metrics?: WellnessMetrics | null;
    analysis?: DayAnalysis | null;
    events?: CalendarEvent[];
    onAddEvent?: (event: CalendarEvent) => void;
    onUpdateEvent?: (event: CalendarEvent) => void;
    onDeleteEvent?: (id: string) => void;
}

// --- HELPERS ---
const useGeolocation = () => {
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            setStatus('error');
            return;
        }

        setStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setStatus('success');
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setError('Location access denied. Using default location.');
                    // Suppress console error for permission denial to avoid noise
                } else {
                    setError(err.message || 'Failed to retrieve location.');
                    console.error("Geo Error:", err.message || err);
                }
                setStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    return { location, error, status };
};

const getButtonClass = (isActive: boolean, persona: Persona = 'Neutral / Stoic') => {
    if (persona === 'Toxic Motivation') {
        return isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200';
    }
    if (persona === 'Softer / Empathetic') {
        return isActive ? 'bg-rose-400 text-white shadow-md shadow-rose-200' : 'text-slate-500 hover:bg-rose-50';
    }
    return isActive ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50';
}

// Shared Activity Icon Helper for Consistency
export const getActivityIcon = (type: string = '') => {
    const t = type.toLowerCase();
    if (t.includes('yoga') || t.includes('flexibility')) return <Flower className="w-5 h-5" />;
    if (t.includes('strength') || t.includes('glutes') || t.includes('upper') || t.includes('lift')) return <Dumbbell className="w-5 h-5" />;
    if (t.includes('cardio') || t.includes('run') || t.includes('cycling')) return <WindIcon className="w-5 h-5" />;
    if (t.includes('full')) return <Flame className="w-5 h-5" />;
    if (t.includes('rest')) return <Coffee className="w-5 h-5" />;
    if (t.includes('pilates')) return <Sparkles className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
};

// Haversine distance helper
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

interface Place {
    id: string;
    name: string;
    lat: number;
    lon: number;
    type: string;
    distance?: string;
    tags?: any;
}

// --- LOCATION VIEW (OpenStreetMap + Leaflet) ---
export const LocationView: React.FC<ViewProps> = ({ persona }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const markersMapRef = useRef<{ [key: string]: any }>({});
  const listRef = useRef<HTMLDivElement>(null);
  
  const [activeCategory, setActiveCategory] = useState('cafe');
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadingPOIs, setLoadingPOIs] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // State for Places List
  const [places, setPlaces] = useState<Place[]>([]);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  const CATEGORIES = [
    { id: 'cafe', label: 'Cafés', icon: <Coffee className="w-4 h-4" /> },
    { id: 'restaurant', label: 'Restaurants', icon: <Utensils className="w-4 h-4" /> },
    { id: 'park', label: 'Parks', icon: <Trees className="w-4 h-4" /> },
    { id: 'gym', label: 'Gyms', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'supermarket', label: 'Groceries', icon: <ShoppingCart className="w-4 h-4" /> },
  ];

  // Initialize Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const defaultCenter = [48.1351, 11.5820]; // Munich
    
    const map = L.map(mapContainerRef.current).setView(defaultCenter, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    setIsMapReady(true);

    // Handle Geolocation logic manually here to integrate tightly with Leaflet
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            map.setView([latitude, longitude], 15);
            
            // Add User Marker
            const userIcon = L.divIcon({
                className: 'bg-emerald-600 w-5 h-5 rounded-full border-2 border-white shadow-lg pulse-animation',
                iconSize: [20, 20]
            });
            
            L.marker([latitude, longitude], { icon: userIcon })
             .addTo(map)
             .bindPopup("<b>You are here</b>");
             
            // Trigger initial fetch
            fetchPOIs(latitude, longitude, activeCategory);
            
        }, (err) => {
            // Quietly fallback to default without error spam
            if (err.code !== err.PERMISSION_DENIED) {
                console.warn("Location access error:", err.message);
            }
            fetchPOIs(defaultCenter[0], defaultCenter[1], activeCategory);
        });
    } else {
        fetchPOIs(defaultCenter[0], defaultCenter[1], activeCategory);
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    }
  }, []);

  // Refetch when category changes
  useEffect(() => {
      if (isMapReady && mapInstanceRef.current) {
          const center = mapInstanceRef.current.getCenter();
          fetchPOIs(center.lat, center.lng, activeCategory);
      }
  }, [activeCategory, isMapReady]);

  // Scroll to active place in list
  useEffect(() => {
    if (activePlaceId && listRef.current) {
        const card = document.getElementById(`place-card-${activePlaceId}`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [activePlaceId]);

  const fetchPOIs = async (lat: number, lng: number, category: string) => {
      setLoadingPOIs(true);
      setPlaces([]);
      setActivePlaceId(null);
      
      if (markersLayerRef.current) {
          markersLayerRef.current.clearLayers();
      }
      markersMapRef.current = {};

      let queryTag = '';
      switch(category) {
          case 'cafe': queryTag = '["amenity"="cafe"]'; break;
          case 'restaurant': queryTag = '["amenity"="restaurant"]'; break;
          case 'park': queryTag = '["leisure"="park"]'; break;
          case 'gym': queryTag = '["leisure"="fitness_centre"]'; break;
          case 'supermarket': queryTag = '["shop"="supermarket"]'; break;
          default: queryTag = '["amenity"="cafe"]';
      }

      // Overpass API Query (Around 1500m)
      const query = `
        [out:json][timeout:25];
        (
          node${queryTag}(around:1500,${lat},${lng});
          way${queryTag}(around:1500,${lat},${lng});
          relation${queryTag}(around:1500,${lat},${lng});
        );
        out center;
      `;

      try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
              method: 'POST',
              body: query
          });
          const data = await response.json();
          const L = (window as any).L;
          const newPlaces: Place[] = [];

          if (mapInstanceRef.current && markersLayerRef.current) {
              data.elements.forEach((el: any) => {
                  const latEl = el.lat || el.center?.lat;
                  const lonEl = el.lon || el.center?.lon;
                  const id = el.id.toString();
                  
                  if (latEl && lonEl) {
                      const name = el.tags?.name || "Unnamed Place";
                      const typeLabel = CATEGORIES.find(c => c.id === category)?.label || "Place";
                      
                      // Create Marker
                      const marker = L.marker([latEl, lonEl])
                        .bindPopup(`
                            <div class="p-1">
                                <strong class="block font-bold text-slate-800">${name}</strong>
                                <span class="text-xs text-slate-500">${typeLabel}</span>
                            </div>
                        `);
                      
                      // Bind click event to highlight card
                      marker.on('click', () => {
                          setActivePlaceId(id);
                      });

                      markersLayerRef.current.addLayer(marker);
                      markersMapRef.current[id] = marker;

                      // Calculate distance from user (or center)
                      const dist = userLocation 
                        ? calculateDistance(userLocation.lat, userLocation.lng, latEl, lonEl)
                        : calculateDistance(lat, lng, latEl, lonEl);

                      newPlaces.push({
                          id,
                          name,
                          lat: latEl,
                          lon: lonEl,
                          type: typeLabel,
                          distance: dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`,
                          tags: el.tags
                      });
                  }
              });
              
              // Sort by distance if possible (simple client-side sort)
              // newPlaces.sort((a, b) => parseFloat(a.distance || '0') - parseFloat(b.distance || '0'));
              setPlaces(newPlaces);
          }

      } catch (error) {
          console.error("Failed to fetch POIs", error);
      } finally {
          setLoadingPOIs(false);
      }
  };

  const handleCardClick = (place: Place) => {
      setActivePlaceId(place.id);
      if (mapInstanceRef.current && markersMapRef.current[place.id]) {
          mapInstanceRef.current.flyTo([place.lat, place.lon], 16, {
             duration: 1.5
          });
          markersMapRef.current[place.id].openPopup();
      }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* TOP SECTION: Header & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 flex-shrink-0 p-6 md:px-10 pt-8 pb-4">
        <div>
            <h2 className="text-3xl font-serif font-bold text-slate-800">Neighborhood</h2>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                {userLocation ? (
                    <span className="text-emerald-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Using your location</span>
                ) : (
                    <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Default Location (Munich)</span>
                )}
            </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${getButtonClass(activeCategory === cat.id, persona)}`}
                >
                    {cat.icon}
                    {cat.label}
                </button>
            ))}
        </div>
      </div>

      {/* CONTENT AREA: MAP + LIST */}
      <div className="flex-1 flex flex-col min-h-0 md:px-10 pb-6 md:pb-10">
          
          {/* MAP CONTAINER */}
          <div className="h-[40%] md:h-[50%] bg-slate-100 rounded-t-[32px] md:rounded-[32px] overflow-hidden border border-slate-200 shadow-inner relative flex-shrink-0 z-10">
              <div ref={mapContainerRef} className="w-full h-full z-0" id="map" />
              
              {loadingPOIs && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg z-[1000] flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                      Finding {activeCategory}...
                  </div>
              )}
              
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm pointer-events-none z-[1000]">
                  © OpenStreetMap contributors
              </div>
          </div>

          {/* LIST CONTAINER */}
          <div ref={listRef} className="flex-1 bg-white md:mt-4 md:rounded-[32px] border border-t-0 md:border-t border-slate-100 overflow-y-auto p-4 custom-scrollbar shadow-sm relative">
              {places.length === 0 && !loadingPOIs ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                       <MapPin className="w-10 h-10 mb-2" />
                       <p className="text-sm font-bold">No places found nearby.</p>
                   </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {places.map(place => (
                          <button
                            key={place.id}
                            id={`place-card-${place.id}`}
                            onClick={() => handleCardClick(place)}
                            className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
                                activePlaceId === place.id 
                                ? 'bg-emerald-50 border-emerald-400 shadow-lg scale-[1.02]' 
                                : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                            }`}
                          >
                              <div className="flex justify-between items-start relative z-10">
                                  <div className="flex gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                          activePlaceId === place.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                                      }`}>
                                          {CATEGORIES.find(c => c.id === activeCategory)?.icon}
                                      </div>
                                      <div>
                                          <h4 className={`font-bold text-sm leading-tight mb-1 ${activePlaceId === place.id ? 'text-slate-900' : 'text-slate-700'}`}>
                                              {place.name}
                                          </h4>
                                          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                                              <span>{place.type}</span>
                                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                              <span className={activePlaceId === place.id ? 'text-emerald-600' : ''}>
                                                  {place.distance} away
                                              </span>
                                          </p>
                                          {/* Optional extra info like Street if available */}
                                          {place.tags?.['addr:street'] && (
                                              <p className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">
                                                  {place.tags['addr:street']} {place.tags['addr:housenumber']}
                                              </p>
                                          )}
                                      </div>
                                  </div>
                                  
                                  {activePlaceId === place.id && (
                                      <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-sm">
                                          <Navigation className="w-3 h-3 fill-current" />
                                      </div>
                                  )}
                              </div>
                          </button>
                      ))}
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};

// --- WEATHER VIEW ---
export const WeatherView: React.FC<ViewProps> = ({ persona }) => {
  const { location, status } = useGeolocation();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  // Default Fallback (Munich) if geo is denied
  const DEFAULT_LOCATION = { lat: 48.1351, lng: 11.5820 };

  useEffect(() => {
    if (weatherData || loading) return; // Prevent unnecessary fetching

    if (status === 'success' && location) {
        setLoading(true);
        getLocalWeather(location.lat, location.lng).then(res => {
            if (res) {
                setWeatherData(res.data);
                setSources(res.sources || []);
            }
            setLoading(false);
        });
    } else if (status === 'error') {
        // Automatically fetch for default location if denied/error
        setLoading(true);
        getLocalWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng).then(res => {
            if (res) {
                setWeatherData(res.data);
                setSources(res.sources || []);
            }
            setLoading(false);
        });
    }
  }, [location, status, weatherData, loading]);

  // Mock backup if completely offline or initial load
  const displayData = weatherData || {
      location: status === 'locating' ? "Locating..." : "Munich, DE (Offline)",
      temp: "--",
      condition: "Loading...",
      wmo_code: 3,
      wind: "--",
      humidity: "--",
      uv_index: "0",
      sunrise: "--:--",
      sunset: "--:--",
      recommendation: "Just a moment...",
      clothing_top: "Layer up",
      clothing_shoes: "Comfy shoes"
  };

  const getGradient = () => {
      if (persona === 'Toxic Motivation') return 'from-slate-800 to-black';
      if (persona === 'Softer / Empathetic') return 'from-rose-300 to-pink-400';
      return 'from-sky-400 to-blue-500';
  }

  // --- MODERN AESTHETIC OUTFIT LOGIC ---
  const getOutfitSuggestions = (tempStr: string, condition: string) => {
    const temp = parseInt(tempStr) || 20; 
    const cond = condition ? condition.toLowerCase() : '';
    const suggestions = [];

    const isRaining = cond.includes('rain') || cond.includes('drizzle') || cond.includes('storm');
    const isSnowing = cond.includes('snow') || cond.includes('ice');
    const isClear = !isRaining && !isSnowing;

    // 1. PRECIPITATION LOGIC
    if (isRaining) {
        suggestions.push({
            title: "Rainy Day Vibes",
            desc: "Waterproof trench & layers.",
            // Aesthetic Rain
            image: "https://images.unsplash.com/photo-1534260933263-8f431716e6a3?q=80&w=800&auto=format&fit=crop" 
        });
        suggestions.push({
            title: "Cozy Indoors",
            desc: "If you don't have to go out, don't.",
            // Coffee/Book aesthetic
            image: "https://images.unsplash.com/photo-1498606073779-09c49632a825?q=80&w=800&auto=format&fit=crop"
        });
    } else if (isSnowing) {
        suggestions.push({
            title: "Snow Aesthetic",
            desc: "Puffer jackets and thermal layers.",
            // Winter Fashion
            image: "https://images.unsplash.com/photo-1517260739337-6799d239ce83?q=80&w=800&auto=format&fit=crop"
        });
        suggestions.push({
            title: "Winter Warmth",
            desc: "Heavy knits and scarves.",
            // Cozy Scarf
            image: "https://images.unsplash.com/photo-1577460555134-4d69cc518d33?q=80&w=800&auto=format&fit=crop"
        });
    }

    // 2. TEMPERATURE LOGIC (If not actively storming, or as secondary options)
    if (temp < 5) {
        // FREEZING / COLD
        suggestions.push({
            title: "Crisp Cold",
            desc: "Structured coats & boots.",
            // Clean winter street style
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"
        });
        if (suggestions.length < 2) {
            suggestions.push({
                title: "Layering Season",
                desc: "Turtlenecks & wool blends.",
                image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=800&auto=format&fit=crop"
            });
        }
    } else if (temp >= 5 && temp < 15) {
        // COOL / TRANSITIONAL
        suggestions.push({
            title: "City Stroll",
            desc: "Trench coat or bomber jacket.",
            // Autumn/Spring vibe
            image: "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?q=80&w=800&auto=format&fit=crop"
        });
        suggestions.push({
            title: "Casual Layers",
            desc: "Hoodie and denim.",
            // Streetwear vibe
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
        });
    } else if (temp >= 15 && temp < 25) {
        // MILD / PERFECT
        suggestions.push({
            title: "Minimalist Clean",
            desc: "T-shirt and loose trousers.",
            // Clean aesthetic
            image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop"
        });
        suggestions.push({
            title: "Coffee Run Fit",
            desc: "Sneakers and light fabrics.",
            // Lifestyle coffee
            image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop"
        });
    } else {
        // HOT (> 25)
        suggestions.push({
            title: "Summer Linen",
            desc: "Breathable fabrics are key.",
            // Linen/Summer
            image: "https://images.unsplash.com/photo-1504194921103-f8b80cadd5e4?q=80&w=800&auto=format&fit=crop"
        });
        suggestions.push({
            title: "Sun Shield",
            desc: "Sunglasses and SPF always.",
            // Sunglasses aesthetic
            image: "https://images.unsplash.com/photo-1511923248895-7431f58a860c?q=80&w=800&auto=format&fit=crop"
        });
    }
    
    // Ensure we only return unique suggestions (deduplicate based on title if logic overlaps)
    return suggestions.slice(0, 3); 
  };

  const outfitSuggestions = getOutfitSuggestions(displayData.temp, displayData.condition);

  const getWeatherIcon = (code: any) => {
      const c = parseInt(code);
      if (isNaN(c)) return <CloudSun className="w-40 h-40 text-yellow-300 drop-shadow-lg opacity-90" />;
      
      if (c === 0) return <Sun className="w-40 h-40 text-yellow-300 drop-shadow-lg opacity-90" />;
      if (c >= 1 && c <= 3) return <Cloud className="w-40 h-40 text-slate-200 drop-shadow-lg opacity-90" />;
      if ([45, 48].includes(c)) return <CloudFog className="w-40 h-40 text-slate-300 drop-shadow-lg opacity-90" />;
      if ([51, 53, 55, 56, 57].includes(c)) return <CloudDrizzle className="w-40 h-40 text-blue-200 drop-shadow-lg opacity-90" />;
      if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return <CloudRain className="w-40 h-40 text-blue-400 drop-shadow-lg opacity-90" />;
      if ([71, 73, 75, 77, 85, 86].includes(c)) return <CloudSnow className="w-40 h-40 text-white drop-shadow-lg opacity-90" />;
      if ([95, 96, 99].includes(c)) return <CloudLightning className="w-40 h-40 text-yellow-400 drop-shadow-lg opacity-90" />;
      
      return <CloudSun className="w-40 h-40 text-yellow-300 drop-shadow-lg opacity-90" />;
  };

  // Calculate an "Outdoor Score" (0-10) for wellness
  const outdoorScore = useMemo(() => {
      let score = 10;
      const temp = parseInt(displayData.temp) || 20;
      const code = parseInt(displayData.wmo_code) || 0;
      
      // Deduced from rain
      if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) score -= 4;
      if ([95, 96, 99].includes(code)) score -= 8; // Storm
      
      // Deduced from extreme temp
      if (temp < 0 || temp > 35) score -= 3;
      
      // Deduced from wind (simple parse check)
      const windVal = parseInt(displayData.wind) || 0;
      if (windVal > 30) score -= 3;

      return Math.max(0, Math.min(10, score));
  }, [displayData]);

  return (
    <div className="h-full p-6 md:p-10 overflow-y-auto flex flex-col items-center custom-scrollbar">
        <div className="max-w-5xl w-full space-y-8 pb-10">
            
            {/* MAIN WEATHER CARD */}
            <div className={`bg-gradient-to-br ${getGradient()} rounded-[40px] p-8 md:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden min-h-[320px]`}>
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

                {/* Left Info */}
                <div className="relative z-10 flex-1 text-center md:text-left">
                     <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/10">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {status === 'locating' ? 'Locating...' : displayData.location}
                            {status === 'error' && !loading && " (Default)"}
                        </span>
                     </div>
                     
                     <div className="mb-6">
                        <h1 className="text-8xl md:text-9xl font-serif font-bold tracking-tighter leading-none">{displayData.temp}°</h1>
                        <p className="text-2xl font-medium text-white/80 mt-2">{displayData.condition}</p>
                     </div>

                     <div className="flex items-center justify-center md:justify-start gap-6 text-sm font-bold">
                         <div className="flex items-center gap-2 opacity-80">
                             <Wind className="w-5 h-5" /> {displayData.wind}
                         </div>
                         <div className="w-px h-4 bg-white/30"></div>
                         <div className="flex items-center gap-2 opacity-80">
                             <Droplet className="w-5 h-5" /> {displayData.humidity}
                         </div>
                     </div>
                </div>

                {/* Right Illustration (Icon) */}
                <div className="relative z-10 mt-8 md:mt-0">
                    {getWeatherIcon(displayData.wmo_code)}
                </div>
                
                {sources.length > 0 && (
                    <div className="absolute bottom-4 right-4 z-10 text-[10px] opacity-50">
                        Source: Open-Meteo API
                    </div>
                )}
            </div>

            {/* ASTRO & VITALITY SECTION (NEW) */}
            <div>
                <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    Vitality & Environment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Outdoor Score */}
                    <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Trees className="w-5 h-5" /></span>
                            <span className="text-2xl font-serif font-bold text-slate-800">{outdoorScore}/10</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-700">Outdoor Score</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1">
                                {outdoorScore >= 8 ? "Perfect for a walk." : outdoorScore >= 5 ? "Decent conditions." : "Maybe stay inside."}
                            </p>
                        </div>
                    </div>

                    {/* UV Index */}
                    <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <span className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Sun className="w-5 h-5" /></span>
                            <span className="text-2xl font-serif font-bold text-slate-800">{displayData.uv_index || 0}</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-700">Max UV Index</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1">
                                {parseFloat(displayData.uv_index) > 5 ? "SPF required." : "Low exposure risk."}
                            </p>
                        </div>
                    </div>

                    {/* Sunrise */}
                    <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                             <span className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Sunrise className="w-5 h-5" /></span>
                             <span className="text-xl font-serif font-bold text-slate-800">{displayData.sunrise}</span>
                        </div>
                         <div>
                            <p className="font-bold text-sm text-slate-700">Sunrise</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1">Morning light resets circadian rhythm.</p>
                        </div>
                    </div>

                    {/* Sunset */}
                    <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                             <span className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Sunset className="w-5 h-5" /></span>
                             <span className="text-xl font-serif font-bold text-slate-800">{displayData.sunset}</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-700">Sunset</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1">Dim lights after this time.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FIT CHECK SECTION (Updated) */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                     <div className={`p-2 rounded-xl ${persona === 'Toxic Motivation' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                         <Shirt className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-serif font-bold text-slate-800">Vibe Check</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{displayData.recommendation}</p>
                     </div>
                </div>

                {/* Scrollable Outfit Cards */}
                <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex gap-6 w-max">
                        {outfitSuggestions.map((item, idx) => (
                            <div key={idx} className="w-72 h-96 bg-white rounded-[32px] border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex-shrink-0">
                                <img 
                                    src={item.image} 
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90"></div>
                                
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <h4 className="font-serif font-bold text-2xl mb-2 leading-tight">{item.title}</h4>
                                    <p className="text-sm font-medium text-white/80 leading-relaxed">{item.desc}</p>
                                    <div className="mt-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Placeholder "Add Your Own" */}
                        <div className="w-40 h-96 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer flex-shrink-0">
                            <Plus className="w-8 h-8" />
                            <span className="text-xs font-bold uppercase text-center px-4">Log Outfit</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

// --- BODY & RHYTHM VIEW (Formerly Fitness) ---

const WORKOUT_TYPES = [
    { id: 'yoga', label: 'Yoga', icon: <Flower className="w-5 h-5 text-purple-500" />, emoji: '🧘' },
    { id: 'pilates', label: 'Pilates', icon: <Sparkles className="w-5 h-5 text-pink-500" />, emoji: '✨' },
    { id: 'glutes', label: 'Glutes', icon: <TrendingUp className="w-5 h-5 text-orange-500" />, emoji: '🍑' },
    { id: 'upper', label: 'Upper Body', icon: <Dumbbell className="w-5 h-5 text-blue-500" />, emoji: '💪' },
    { id: 'cycling', label: 'Cycling', icon: <Bike className="w-5 h-5 text-teal-500" />, emoji: '🚴' },
    { id: 'running', label: 'Running', icon: <WindIcon className="w-5 h-5 text-indigo-500" />, emoji: '🏃‍♀️' },
    { id: 'fullbody', label: 'Full Body', icon: <Flame className="w-5 h-5 text-red-500" />, emoji: '🔥' },
    { id: 'stretching', label: 'Stretching', icon: <Move className="w-5 h-5 text-emerald-500" />, emoji: '🌀' },
];

const CircularProgress = ({ percentage, steps, goal }: { percentage: number, steps: number, goal: number }) => {
    const radius = 70;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
    return (
        <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                <circle
                    stroke="rgb(241, 245, 249)" // slate-100
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="rgb(16, 185, 129)" // emerald-500
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                 <Footprints className="w-5 h-5 text-emerald-500 mb-1" />
                 <span className="text-2xl font-serif font-bold text-slate-800 leading-none">{Math.round(percentage)}%</span>
                 <span className="text-[8px] font-bold uppercase text-slate-400 mt-1">Daily Goal</span>
            </div>
        </div>
    );
};

const WeekCalendar = ({ history, onSelectDay, selectedDate }: { history: CalendarEvent[], onSelectDay: (date: Date) => void, selectedDate: Date | null }) => {
    const [anchorDate, setAnchorDate] = useState(new Date());

    const days = useMemo(() => {
        // Start the view from this week's Monday
        const start = new Date(anchorDate);
        const day = start.getDay(); // 0 is Sunday
        // Adjust to Monday as start of week (ISO)
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(start.setDate(diff));
        
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(d.getDate() + i); 
            d.setHours(0,0,0,0);
            return d;
        });
    }, [anchorDate]);

    const navigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(anchorDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setAnchorDate(newDate);
    };

    return (
        <div className="flex flex-col gap-6">
             {/* Navigation Header */}
             <div className="flex items-center justify-between px-2">
                 <button onClick={() => navigate('prev')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                 </button>
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full flex items-center gap-2">
                     <CalendarDays className="w-3 h-3" />
                     {days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                 </span>
                 <button 
                    onClick={() => navigate('next')} 
                    className={`p-2 rounded-full hover:bg-slate-100 text-slate-400`}
                 >
                    <ChevronRight className="w-5 h-5" />
                 </button>
             </div>

             {/* Days Grid */}
             <div className="flex justify-between items-center">
                 {days.map((day, idx) => {
                     // Find log for this day
                     const log = history.find(h => h.start.toDateString() === day.toDateString());
                     const isToday = day.toDateString() === new Date().toDateString();
                     const isSelected = selectedDate?.toDateString() === day.toDateString();
                     const isFuture = day > new Date();
                     
                     // Visual Calculation
                     let boxClass = "";
                     let iconContent = null;

                     if (log) {
                         if (log.status === 'missed') {
                             // MISSED STYLE: Faded, Crossed, Red tint
                             boxClass = isSelected
                                ? 'bg-red-50 border-2 border-red-300 text-red-400 shadow-md scale-105 opacity-80'
                                : 'bg-slate-50 border-2 border-transparent text-slate-300 hover:bg-red-50';
                             iconContent = (
                                 <div className="relative">
                                     {getActivityIcon(log.workoutType)}
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <X className="w-6 h-6 text-red-400 opacity-50" />
                                     </div>
                                 </div>
                             );
                         } else if (log.status === 'planned') {
                             // PLANNED STYLE: Dashed, Lighter
                             boxClass = isSelected 
                                ? 'bg-slate-50 border-2 border-dashed border-slate-800 text-slate-800 shadow-md scale-105'
                                : 'bg-white border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-300 hover:text-emerald-500';
                             iconContent = getActivityIcon(log.workoutType);
                         } else {
                             // LOGGED/COMPLETED STYLE: Solid, Color
                             boxClass = isSelected
                                ? 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-md scale-105'
                                : 'bg-emerald-100 border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-200';
                             iconContent = getActivityIcon(log.workoutType);
                         }
                     } else {
                         // EMPTY STYLE
                         boxClass = isSelected 
                            ? 'bg-white border-2 border-slate-900 text-slate-900 shadow-md scale-105' 
                            : isToday
                                ? 'bg-white border-2 border-emerald-400 text-emerald-500'
                                : 'bg-slate-50 border-2 border-transparent text-slate-200 hover:bg-white hover:border-slate-200';
                         iconContent = <Plus className={`w-4 h-4 ${isSelected || isFuture ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />;
                     }
                     
                     return (
                         <button 
                            key={idx} 
                            onClick={() => onSelectDay(day)}
                            className="flex flex-col items-center gap-3 group focus:outline-none"
                         >
                             <div className="flex flex-col items-center">
                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                                </span>
                                <span className={`text-[9px] font-bold ${isToday ? 'text-emerald-500' : 'text-slate-300 group-hover:text-emerald-400'}`}>
                                    {day.getDate().toString().padStart(2, '0')}
                                </span>
                             </div>
                             
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${boxClass}`}>
                                 {iconContent}
                             </div>
                         </button>
                     )
                 })}
             </div>
        </div>
    )
}

export const FitnessView: React.FC<ViewProps> = ({ 
    persona, profile, metrics, analysis, 
    events = [], onAddEvent, onUpdateEvent, onDeleteEvent 
}) => {
  const isFloConnected = profile?.connectedApps?.includes('Flo') || profile?.hasCycle;
  const isFitnessConnected = profile?.connectedApps?.some(app => app.includes('Fitness') || app.includes('Health'));
  
  // Filter only Health events for internal tracking display
  const history = events.filter(e => e.source === EventSource.HEALTH);
  
  // Adding/Viewing workout state
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Default to today
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  
  // State for Steps
  const [steps, setSteps] = useState(6430);
  const [stepGoal, setStepGoal] = useState(10000);
  const percent = Math.min((steps / stepGoal) * 100, 100);

  const currentPhase = {
      name: 'Luteal',
      day: 24,
      nextPeriod: '3 Days',
      symptoms: 'Low Energy, Bloating',
      icon: <Moon className="w-6 h-6 text-pink-400" />,
      color: 'bg-pink-50 border-pink-100 text-pink-800',
      energy: 'Waning',
      feeling: 'Reflective, nesting mode.'
  };
  
  const handleSaveWorkout = (activityName: string, type: any = 'cardio') => {
      if (!selectedDate || !onAddEvent) return;
      
      const startDate = new Date(selectedDate);
      startDate.setHours(9, 0, 0, 0); // Default to morning for now
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0);

      const newEvent: CalendarEvent = {
          id: `workout-${Date.now()}`,
          title: activityName,
          start: startDate,
          end: endDate,
          source: EventSource.HEALTH,
          isFixed: true,
          status: 'planned', // ALWAYS planned initially
          workoutType: type
      };

      onAddEvent(newEvent);
      setIsAddingMode(false);
      setCustomActivity('');
  }

  // Enhanced Smart Suggestion Logic
  const getSmartSuggestion = () => {
      // 1. Check Metrics (Stress/Sleep)
      if (metrics) {
          if (metrics.stressLevel > 7 && persona !== 'Toxic Motivation') {
              return {
                  type: "stress_relief",
                  title: "Stress Detected",
                  reason: "High System Load",
                  desc: "Skip the heavy lifting. A 15-min restorative flow will do more for you today than a PR.",
                  action: "Add to Plan",
                  workoutId: 'yoga',
                  workoutTitle: 'Restorative Yoga',
                  icon: <Coffee className="w-8 h-8 text-indigo-500" />,
                  bg: "bg-indigo-50 border-indigo-100"
              };
          }
          if (metrics.sleepHours < 6 && persona !== 'Toxic Motivation') {
               return {
                  type: "recovery",
                  title: "Low Battery",
                  reason: "Poor Sleep",
                  desc: "Avoid HIIT. Focus on steady-state movement or mobility work to recharge without draining.",
                  action: "Add to Plan",
                  workoutId: 'stretching',
                  workoutTitle: 'Mobility Flow',
                  icon: <Moon className="w-8 h-8 text-blue-500" />,
                  bg: "bg-blue-50 border-blue-100"
              };
          }
      }

      // 2. Check Cycle Phase (Only if connected)
      if (isFloConnected && currentPhase.name === 'Luteal' && persona !== 'Toxic Motivation') {
          return {
              type: "cycle_sync",
              title: "Luteal Phase Sync",
              reason: "Cycle Awareness",
              desc: "Energy is naturally waning. Swap intense cardio for Pilates or strength training.",
              action: "Add to Plan",
              workoutId: 'pilates',
              workoutTitle: 'Low Impact Pilates',
              icon: <Sparkles className="w-8 h-8 text-pink-500" />,
              bg: "bg-pink-50 border-pink-100"
          };
      }

      // 3. Default / Persona based
      if (persona === 'Toxic Motivation') {
          return {
              type: "discipline",
              title: "No Excuses.",
              reason: "Goal Incomplete",
              desc: `You're at ${Math.round(percent)}%. Finish the remaining steps now. Pain is temporary.`,
              action: "Add to Plan",
              workoutId: 'running',
              workoutTitle: '5k Run',
              icon: <Flame className="w-8 h-8 text-slate-900" />,
              bg: "bg-slate-100 border-slate-200"
          }
      }
      
      return {
          type: "momentum",
          title: "Maintain Momentum",
          reason: "Consistency",
          desc: "A 30-minute active recovery session will keep your streak alive without burnout.",
          action: "Add to Plan",
          workoutId: 'running',
          workoutTitle: 'Active Recovery',
          icon: <Activity className="w-8 h-8 text-emerald-500" />,
          bg: "bg-emerald-50 border-emerald-100"
      }
  };

  const suggestion = getSmartSuggestion();

  const SuggestionCard = ({ suggestion, onAdd }: { suggestion: any, onAdd: (title: string, id: string) => void }) => (
    <div className={`relative rounded-[32px] p-8 border-2 ${suggestion.bg} transition-all hover:shadow-lg flex flex-col md:flex-row items-start md:items-center gap-8 bg-white/80 backdrop-blur-sm`}>
        {/* Visual Side */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center text-center bg-white/60 rounded-2xl p-6 backdrop-blur-sm border border-white/50 shadow-sm">
             <div className="p-4 rounded-full bg-white shadow-sm mb-4">
                 {suggestion.icon}
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{suggestion.type.replace('_', ' ')}</span>
        </div>

        {/* Content Side */}
        <div className="flex-1">
             <span className="inline-block px-3 py-1 rounded-full bg-white border border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-4 shadow-sm">
                 Why: {suggestion.reason}
             </span>
             <h3 className="text-2xl font-serif font-bold text-slate-800 mb-3">{suggestion.title}</h3>
             <p className="text-slate-600 font-medium leading-relaxed mb-6">
                {suggestion.desc}
             </p>
             <button 
                onClick={() => onAdd(suggestion.workoutTitle, suggestion.workoutId)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg hover:shadow-emerald-200 group"
            >
                 <Plus className="w-4 h-4" />
                 {suggestion.action}
             </button>
        </div>
    </div>
  );

  // Get workouts for selected day
  const selectedDayWorkouts = selectedDate 
      ? history.filter(h => h.start.toDateString() === selectedDate.toDateString())
      : [];

  return (
    <div className="h-full p-6 md:p-10 overflow-y-auto custom-scrollbar relative">
      {/* Faded Background */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
         
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-serif font-bold text-slate-800">Body & Rhythm</h2>
                <p className="text-slate-500 font-medium">Your physical baseline and energy flow.</p>
            </div>
            {!isFloConnected && !isFitnessConnected && (
                <span className="hidden md:inline-block text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 border border-slate-200">Connect apps in settings</span>
            )}
         </div>

         {/* 1. ACTIVITY HUB (Top Priority) */}
         <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
             <div className="flex items-start justify-between mb-8">
                 <div>
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-slate-800">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        Activity Hub
                    </h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Daily Movement</p>
                 </div>
                 {isFitnessConnected && (
                     <div className="p-2 bg-slate-50 rounded-full">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                     </div>
                 )}
             </div>

             <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                {/* Clean Circular Progress */}
                <div className="flex-shrink-0">
                    <CircularProgress percentage={percent} steps={steps} goal={stepGoal} />
                </div>

                {/* Stats Grid */}
                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                         <span className="text-3xl font-serif font-bold text-slate-800 block">{steps.toLocaleString()}</span>
                         <span className="text-[10px] font-bold uppercase text-slate-400 mt-1">Actual Steps</span>
                     </div>
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                         <span className="text-3xl font-serif font-bold text-slate-800 block">{stepGoal.toLocaleString()}</span>
                         <span className="text-[10px] font-bold uppercase text-slate-400 mt-1">Goal Steps</span>
                     </div>
                     <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 col-span-2 flex items-center justify-between">
                         <div>
                            <span className="text-2xl font-serif font-bold text-orange-900 block">420 Kcal</span>
                            <span className="text-[10px] font-bold uppercase text-orange-400">Active Energy</span>
                         </div>
                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                             <Flame className="w-5 h-5" />
                         </div>
                     </div>
                </div>
             </div>
         </div>

         {/* 2. FLO QUADRANT (Conditional - Expanded Details) */}
         {isFloConnected && (
             <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden relative group flex flex-col animate-in fade-in slide-in-from-bottom-4">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                     {currentPhase.icon}
                 </div>
                 
                 {/* Header Phase Info */}
                 <div className="p-8 pb-4 flex items-start justify-between">
                     <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center shadow-sm border border-pink-100">
                             {currentPhase.icon}
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-slate-800">Menstrual Phase</h3>
                             <div className="flex items-center gap-2 mt-1">
                                 <span className="text-xs text-pink-500 font-bold uppercase tracking-wider bg-pink-50 px-2 py-0.5 rounded-md">{currentPhase.name}</span>
                                 <span className="text-xs text-slate-400 font-medium">• Day {currentPhase.day}</span>
                             </div>
                         </div>
                     </div>
                     <div className="text-right hidden sm:block">
                         <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Next Period</span>
                         <span className="text-lg font-serif font-bold text-pink-500">in {currentPhase.nextPeriod}</span>
                     </div>
                 </div>

                 <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Insight Card */}
                     <div className="bg-pink-50/50 rounded-2xl p-5 border border-pink-100">
                         <span className="text-[10px] font-bold uppercase text-pink-400 flex items-center gap-2 mb-2">
                             <Zap className="w-3 h-3" /> Energy Forecast
                         </span>
                         <p className="font-serif text-lg font-bold text-slate-700 leading-tight">{currentPhase.energy}</p>
                         <p className="text-xs text-slate-500 mt-1 leading-relaxed">{currentPhase.feeling}</p>
                     </div>
                     
                     {/* Symptoms / Status */}
                     <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 mb-2">
                             <Activity className="w-3 h-3" /> Typical Symptoms
                         </span>
                         <div className="flex flex-wrap gap-2">
                             {currentPhase.symptoms.split(',').map((s, i) => (
                                 <span key={i} className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600">
                                     {s.trim()}
                                 </span>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
         )}

         {/* 3. WORKOUT TRACKER & PLANNER */}
         <div className="bg-white rounded-[40px] border border-slate-100 shadow-lg p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-800 text-lg">Workout Tracker</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Weekly View</span>
            </div>

            <div className="flex-1 flex flex-col">
               <WeekCalendar 
                    history={history} 
                    selectedDate={selectedDate}
                    onSelectDay={(date) => {
                        setSelectedDate(date);
                        setIsAddingMode(false);
                    }} 
               />
               
               {/* DAY DETAIL CARD - REPLACES LIST */}
               <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-slate-100 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center justify-between mb-4">
                       <h4 className="font-serif font-bold text-slate-800 text-lg">
                           {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
                       </h4>
                       {selectedDate && !isAddingMode && (
                           <button 
                               onClick={() => setIsAddingMode(true)}
                               className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-emerald-600 transition-colors"
                           >
                               <Plus className="w-3 h-3" /> Plan Workout
                           </button>
                       )}
                   </div>

                   {isAddingMode && selectedDate ? (
                       <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold uppercase text-slate-400">Select Activity</span>
                                <button onClick={() => setIsAddingMode(false)}><X className="w-4 h-4 text-slate-400" /></button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                {WORKOUT_TYPES.map(workout => (
                                    <button 
                                        key={workout.id}
                                        onClick={() => handleSaveWorkout(workout.label, workout.id)}
                                        className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:scale-105 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm group-hover:shadow-md">
                                            {workout.icon}
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-bold text-slate-600 block">{workout.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 p-2 pl-4 rounded-xl border border-slate-100">
                                <input 
                                    type="text"
                                    value={customActivity}
                                    onChange={(e) => setCustomActivity(e.target.value)}
                                    placeholder="Custom activity..."
                                    className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 placeholder-slate-400 focus:ring-0"
                                    onKeyDown={(e) => e.key === 'Enter' && customActivity && handleSaveWorkout(customActivity, 'custom')}
                                />
                                <button 
                                    onClick={() => customActivity && handleSaveWorkout(customActivity, 'custom')}
                                    className="p-2 bg-slate-900 text-white rounded-lg"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                       </div>
                   ) : (
                       <div className="space-y-3">
                           {selectedDayWorkouts.length > 0 ? (
                               selectedDayWorkouts.map(log => {
                                   const iconContent = getActivityIcon(log.workoutType);
                                   // Consistent styling with WeekCalendar logic
                                   let boxClass = '';
                                   if (log.status === 'missed') {
                                        boxClass = 'bg-red-50 border border-red-100 text-red-400';
                                   } else if (log.status === 'planned') {
                                        boxClass = 'bg-slate-50 border border-dashed border-slate-200 text-slate-400';
                                   } else {
                                        boxClass = 'bg-emerald-100 border border-emerald-100 text-emerald-600';
                                   }

                                   return (
                                       <div key={log.id} className={`flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm group ${log.status === 'missed' ? 'opacity-60' : ''}`}>
                                           <div className="flex items-center gap-3">
                                               <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative ${boxClass}`}>
                                                   {iconContent}
                                                   {log.status === 'missed' && <div className="absolute inset-0 flex items-center justify-center"><X className="w-8 h-8 opacity-50" /></div>}
                                               </div>
                                               <div>
                                                   {/* Clean Workout Name, removing any emojis if they were stored previously */}
                                                   <span className={`font-bold block text-lg ${log.status === 'missed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                       {log.title.replace(/[\u{1F300}-\u{1F6FF}]/gu, '').trim()} 
                                                   </span>
                                                   <span className="text-xs text-slate-400 font-medium uppercase flex items-center gap-1">
                                                       {log.workoutType === 'custom' ? 'Custom' : log.workoutType} • 
                                                       {log.status === 'missed' ? <span className="text-red-400 font-bold">Missed</span> : log.status === 'planned' ? 'Planned' : 'Completed'}
                                                   </span>
                                               </div>
                                           </div>
                                           
                                           <div className="flex items-center gap-2">
                                               {/* Action Buttons for Planned Workouts */}
                                               {log.status === 'planned' && onUpdateEvent && (
                                                   <>
                                                       <button 
                                                           onClick={() => onUpdateEvent({...log, status: 'completed'})}
                                                           className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors"
                                                           title="Mark Done"
                                                       >
                                                           <Check className="w-4 h-4" />
                                                       </button>
                                                       <button 
                                                           onClick={() => onUpdateEvent({...log, status: 'missed'})}
                                                           className="p-2 bg-slate-50 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-xl transition-colors"
                                                           title="Mark Missed"
                                                       >
                                                           <X className="w-4 h-4" />
                                                       </button>
                                                       <div className="w-px h-6 bg-slate-100 mx-1"></div>
                                                   </>
                                               )}

                                               {onDeleteEvent && (
                                                    <button onClick={() => onDeleteEvent(log.id)} className="p-2 text-slate-300 hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                               )}
                                           </div>
                                       </div>
                                   );
                               })
                           ) : (
                               <div className="text-center py-8 opacity-50">
                                   <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                   <p className="text-sm font-bold text-slate-400">Rest Day</p>
                                   <p className="text-xs text-slate-400">No activities planned for this day.</p>
                               </div>
                           )}
                       </div>
                   )}
               </div>
            </div>
        </div>

        {/* 4. SUGGESTIONS (Redesigned) */}
        <SuggestionCard suggestion={suggestion} onAdd={handleSaveWorkout} />

      </div>
    </div>
  );
};

// --- TOOLS VIEW COMPONENTS ---

// 1. FOCUS TIMER (Enhanced)
const FocusTimer = ({ persona, onBack }: { persona: Persona, onBack: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  
    useEffect(() => {
      let interval: any = null;
      if (isActive && timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
      }
      return () => clearInterval(interval);
    }, [isActive, timeLeft]);
  
    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
      setIsActive(false);
      if (mode === 'focus') setTimeLeft(25 * 60);
      if (mode === 'short') setTimeLeft(5 * 60);
      if (mode === 'long') setTimeLeft(15 * 60);
    };
  
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
  
    const setTimerMode = (m: 'focus' | 'short' | 'long') => {
      setMode(m);
      setIsActive(false);
      if (m === 'focus') setTimeLeft(25 * 60);
      if (m === 'short') setTimeLeft(5 * 60);
      if (m === 'long') setTimeLeft(15 * 60);
    }
  
    const getPlayButtonClass = () => {
        if (persona === 'Toxic Motivation') return isActive ? 'bg-slate-800 shadow-slate-400' : 'bg-slate-900 shadow-slate-200';
        if (persona === 'Softer / Empathetic') return isActive ? 'bg-rose-400 shadow-rose-200' : 'bg-rose-300 shadow-rose-100';
        return isActive ? 'bg-amber-500 shadow-amber-200' : 'bg-emerald-600 shadow-emerald-200';
    }

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-50 duration-300 relative">
             <button onClick={onBack} className="absolute top-0 left-0 p-2 rounded-full bg-white text-slate-500 hover:bg-slate-100 flex items-center gap-2 text-xs font-bold shadow-sm">
                 <ArrowLeft className="w-4 h-4" /> Back
             </button>
             
             <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/50 rounded-[40px] shadow-2xl p-10 text-center">
                <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6">Focus Flow</h2>
                <div className="flex justify-center gap-2 mb-10 bg-slate-100 p-1 rounded-full inline-flex mx-auto">
                    <button onClick={() => setTimerMode('focus')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === 'focus' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Focus</button>
                    <button onClick={() => setTimerMode('short')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === 'short' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Short Break</button>
                    <button onClick={() => setTimerMode('long')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === 'long' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Long Break</button>
                </div>
                <div className="text-8xl font-mono font-bold text-slate-800 tracking-tighter mb-10">
                    {formatTime(timeLeft)}
                </div>
                <div className="flex items-center justify-center gap-6">
                    <button 
                        onClick={toggleTimer}
                        className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${getPlayButtonClass()}`}
                    >
                        {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>
                    <button 
                        onClick={resetTimer}
                        className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors"
                    >
                        <RotateCcw className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// 2. BREATHING EXERCISE (Visual Guide)
const BreathingExercise = ({ persona, onBack }: { persona: Persona, onBack: () => void }) => {
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [count, setCount] = useState(4);

    useEffect(() => {
        let timer: any;
        if (phase === 'Inhale') {
            // Inhale 4s
            timer = setTimeout(() => { setPhase('Hold'); setCount(4); }, 4000);
        } else if (phase === 'Hold') {
            // Hold 4s
            timer = setTimeout(() => { setPhase('Exhale'); setCount(4); }, 4000);
        } else if (phase === 'Exhale') {
            // Exhale 4s (Box Breathing style for simplicity in logic, can vary)
            timer = setTimeout(() => { setPhase('Inhale'); setCount(4); }, 4000);
        }
        return () => clearTimeout(timer);
    }, [phase]);

    // Instruction Text based on Persona
    const getInstruction = () => {
        if (persona === 'Toxic Motivation') {
            if (phase === 'Inhale') return "INHALE POWER";
            if (phase === 'Hold') return "HOLD THE PAIN";
            if (phase === 'Exhale') return "EXHALE WEAKNESS";
        }
        if (persona === 'Softer / Empathetic') {
            if (phase === 'Inhale') return "Breathe in peace...";
            if (phase === 'Hold') return "Hold gently...";
            if (phase === 'Exhale') return "Let it all go...";
        }
        return phase; // Neutral
    }

    // Animation Styles
    const getCircleStyle = () => {
        let base = "transition-all duration-[4000ms] ease-in-out rounded-full flex items-center justify-center ";
        
        if (phase === 'Inhale') return base + "w-64 h-64 bg-emerald-500 shadow-2xl shadow-emerald-200 scale-100 opacity-100";
        if (phase === 'Hold') return base + "w-64 h-64 bg-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.6)] scale-105 opacity-90";
        if (phase === 'Exhale') return base + "w-32 h-32 bg-emerald-200 shadow-none scale-75 opacity-80";
        return base;
    }

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-50 duration-300 relative overflow-hidden">
             <button onClick={onBack} className="absolute top-0 left-0 p-2 rounded-full bg-white text-slate-500 hover:bg-slate-100 flex items-center gap-2 text-xs font-bold shadow-sm z-10">
                 <ArrowLeft className="w-4 h-4" /> Back
             </button>
             
             <div className="text-center relative z-10">
                 <h2 className="text-xl font-serif font-bold text-slate-400 mb-12 tracking-widest uppercase">Box Breathing</h2>
                 
                 <div className="h-80 flex items-center justify-center mb-8">
                     <div className="transition-all duration-[4000ms] ease-in-out rounded-full flex items-center justify-center w-64 h-64">
                        <div className={getCircleStyle()}>
                            <span className="text-white font-bold text-2xl opacity-0 animate-in fade-in duration-1000">{phase}</span>
                        </div>
                     </div>
                 </div>
                 
                 <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-800 animate-pulse duration-[4000ms]">
                     {getInstruction()}
                 </h1>
             </div>
        </div>
    )
}

// 3. WORRY BURNER (Emotional Release)
const WorryBurner = ({ persona, onBack }: { persona: Persona, onBack: () => void }) => {
    const [text, setText] = useState('');
    const [isBurning, setIsBurning] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleBurn = () => {
        if (!text.trim()) return;
        setIsBurning(true);
        setTimeout(() => {
            setText('');
            setIsBurning(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 2000); // Animation duration
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-50 duration-300 relative">
            <button onClick={onBack} className="absolute top-0 left-0 p-2 rounded-full bg-white text-slate-500 hover:bg-slate-100 flex items-center gap-2 text-xs font-bold shadow-sm">
                 <ArrowLeft className="w-4 h-4" /> Back
             </button>

             <div className="max-w-lg w-full">
                 <div className="text-center mb-8">
                     <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                         <Flame className="w-8 h-8 fill-current" />
                     </div>
                     <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">The Worry Burner</h2>
                     <p className="text-slate-500">Type out what's stressing you out. Then burn it.</p>
                 </div>

                 <div className="relative">
                     <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="I'm worried about..."
                        className={`w-full h-40 p-6 rounded-3xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 outline-none resize-none transition-all duration-1000 ${isBurning ? 'opacity-0 translate-y-[-50px] scale-95 blur-sm' : 'opacity-100'}`}
                     />
                     
                     {showSuccess && (
                         <div className="absolute inset-0 flex items-center justify-center bg-emerald-50 rounded-3xl border border-emerald-100 animate-in fade-in zoom-in duration-500">
                             <div className="text-center text-emerald-600">
                                 <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                 <span className="font-bold">Gone.</span>
                             </div>
                         </div>
                     )}
                 </div>

                 <button 
                    onClick={handleBurn}
                    disabled={!text || isBurning}
                    className="w-full mt-6 py-4 bg-slate-900 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                     {isBurning ? (
                         <>
                            <Flame className="w-5 h-5 animate-bounce" /> Burning...
                         </>
                     ) : (
                         <>
                            <Trash2 className="w-5 h-5" /> Burn It
                         </>
                     )}
                 </button>
             </div>
        </div>
    )
}

// --- MAIN TOOLS VIEW WRAPPER ---
export const ToolsView: React.FC<ViewProps> = ({ persona }) => {
  const [activeTool, setActiveTool] = useState<'timer' | 'breathing' | 'worry' | null>(null);

  const renderActiveTool = () => {
      switch(activeTool) {
          case 'timer': return <FocusTimer persona={persona || 'Neutral / Stoic'} onBack={() => setActiveTool(null)} />;
          case 'breathing': return <BreathingExercise persona={persona || 'Neutral / Stoic'} onBack={() => setActiveTool(null)} />;
          case 'worry': return <WorryBurner persona={persona || 'Neutral / Stoic'} onBack={() => setActiveTool(null)} />;
          default: return null;
      }
  };

  if (activeTool) {
      return (
          <div className="h-full relative">
              {renderActiveTool()}
          </div>
      );
  }

  // TOOL GRID
  return (
    <div className="h-full p-6 md:p-10 overflow-y-auto flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-serif font-bold text-slate-800 mb-3">Toolkit</h2>
                <p className="text-slate-500 text-lg">Specific tools to regulate your state.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tool 1: Timer */}
                <button 
                    onClick={() => setActiveTool('timer')}
                    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden h-64 flex flex-col justify-between"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Timer className="w-24 h-24" />
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                        <Timer className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Focus Flow</h3>
                        <p className="text-sm text-slate-500">Pomodoro timer to structure your deep work.</p>
                    </div>
                </button>

                {/* Tool 2: Breathing */}
                <button 
                    onClick={() => setActiveTool('breathing')}
                    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden h-64 flex flex-col justify-between"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <WindIcon className="w-24 h-24" />
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                        <WindIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">4-7-8 Breather</h3>
                        <p className="text-sm text-slate-500">Visual guide to down-regulate anxiety.</p>
                    </div>
                </button>

                {/* Tool 3: Worry Burner */}
                <button 
                    onClick={() => setActiveTool('worry')}
                    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden h-64 flex flex-col justify-between"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Flame className="w-24 h-24" />
                    </div>
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Worry Burner</h3>
                        <p className="text-sm text-slate-500">A digital ritual to release negative thoughts.</p>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );
};