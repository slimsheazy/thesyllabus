
import React, { useState, useEffect } from 'react';
import { getHoraryAnalysis } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { logCalculation } from '../services/dbService';
import { useSyllabusStore } from '../store';
import { ReadAloudButton } from './ReadAloudButton';

const GLYPHS: Record<string, string> = {
  'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀', 'Mars': '♂',
  'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '♅', 'Neptune': '♆', 'Pluto': '♇',
  'North Node': '☊', 'South Node': '☋', 'Chiron': '⚷', 'Lilith': '⚸',
  'Ascendant': 'AC', 'Midheaven': 'MC'
};

const CITIES = [
  { name: "Auto-Fill City...", lat: null, lng: null },
  { name: "New York, USA", lat: 40.7128, lng: -74.0060 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Los Angeles, USA", lat: 34.0522, lng: -118.2437 },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Mexico City, Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "Mumbai, India", lat: 19.0760, lng: 72.8777 },
  { name: "Beijing, China", lat: 39.9042, lng: 116.4074 },
  { name: "Cairo, Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Rio de Janeiro, Brazil", lat: -22.9068, lng: -43.1729 },
  { name: "Moscow, Russia", lat: 55.7558, lng: 37.6173 },
  { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Toronto, Canada", lat: 43.6510, lng: -79.3470 },
  { name: "Chicago, USA", lat: 41.8781, lng: -87.6298 },
  { name: "San Francisco, USA", lat: 37.7749, lng: -122.4194 }
];

const ChartWheel: React.FC<{ ascendant: number, planets: any[], aspects: any[] }> = ({ ascendant, planets, aspects }) => {
  const size = 340;
  const center = size / 2;
  const radius = size * 0.4;

  const getPos = (degree: number, rOffset: number = 0) => {
    // Add Math.PI (180 degrees) to rotate 0 position from 3 o'clock (Right) to 9 o'clock (Left)
    const angle = ((degree - ascendant) * (Math.PI / 180)) + Math.PI;
    return {
      x: center + (radius + rOffset) * Math.cos(angle),
      y: center + (radius + rOffset) * Math.sin(angle)
    };
  };

  return (
    <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center p-4">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${size} ${size}`}>
        {/* Outer Ring */}
        <circle 
          cx={center} cy={center} r={radius} 
          fill="none" stroke="var(--marker-black)" 
          strokeWidth="4" strokeDasharray="8,4" 
          opacity="0.5" 
        />
        
        {/* Aspect Lines */}
        {aspects && aspects.map((asp, idx) => {
          const p1Data = planets.find(p => p.name === asp.p1);
          const p2Data = planets.find(p => p.name === asp.p2);
          if (!p1Data || !p2Data) return null;
          const pos1 = getPos(p1Data.degree, -10);
          const pos2 = getPos(p2Data.degree, -10);
          
          const colors: Record<string, string> = {
            'Conjunction': 'var(--marker-purple)',
            'Opposition': 'var(--marker-red)',
            'Square': 'var(--marker-red)',
            'Trine': 'var(--marker-blue)',
            'Sextile': 'var(--marker-teal)'
          };
          
          return (
            <line 
              key={idx}
              x1={pos1.x} y1={pos1.y}
              x2={pos2.x} y2={pos2.y}
              stroke={colors[asp.type] || 'var(--marker-black)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.6"
              className="animate-in fade-in duration-1000"
            />
          );
        })}

        {/* House Cusps */}
        {[...Array(12)].map((_, i) => {
          const angle = ((i * 30 - ascendant) * (Math.PI / 180)) + Math.PI;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line 
              key={i} 
              x1={center} y1={center} x2={x2} y2={y2} 
              stroke={i % 3 === 0 ? "var(--marker-blue)" : "var(--marker-black)"} 
              strokeWidth={i % 3 === 0 ? "4" : "1.5"}
              opacity={i % 3 === 0 ? "0.6" : "0.2"}
            />
          );
        })}

        {/* House Numbers */}
        {[...Array(12)].map((_, i) => {
          // Equal House System: House 1 starts at 0° relative to Asc, so center is 15°
          const angle = (((i * 30 + 15) - ascendant) * (Math.PI / 180)) + Math.PI;
          const rNum = radius * 0.75;
          const x = center + rNum * Math.cos(angle);
          const y = center + rNum * Math.sin(angle);
          return (
            <text 
              key={`h-num-${i}`}
              x={x} y={y} 
              fill="var(--marker-black)" 
              fontSize="14" 
              opacity="0.4"
              textAnchor="middle" 
              dominantBaseline="middle"
              className="handwritten font-bold select-none"
            >
              {i + 1}
            </text>
          );
        })}

        {/* Planets and Glyphs */}
        {planets.map((p, i) => {
          const angle = ((p.degree - ascendant) * (Math.PI / 180)) + Math.PI;
          const x = center + (radius - 18) * Math.cos(angle);
          const y = center + (radius - 18) * Math.sin(angle);
          return (
            <g key={i} className="cursor-default group">
              <circle cx={x} cy={y} r="8" fill="var(--marker-red)" opacity="1" />
              <text 
                x={x} y={y - 18} 
                fill="var(--marker-black)" 
                fontSize="28" 
                textAnchor="middle"
                className="font-black drop-shadow-sm select-none"
              >
                {GLYPHS[p.name] || p.name.substring(0, 2).toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Center Point */}
        <circle cx={center} cy={center} r="8" fill="var(--marker-black)" />
      </svg>
    </div>
  );
};

const HoraryTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  
  const { recordCalculation, userLocation, setUserLocation } = useSyllabusStore();
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(userLocation);

  useEffect(() => {
    // Only attempt Geolocation if we don't have a location set yet
    if (!userLocation && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
           const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
           setLocation(newLoc);
           setUserLocation(newLoc);
        },
        (err) => console.warn("Location services required for precision.")
      );
    }
  }, [setUserLocation, userLocation]);

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CITIES.find(c => c.name === e.target.value);
    if (selected && selected.lat !== null && selected.lng !== null) {
      const newLoc = { lat: selected.lat, lng: selected.lng };
      setLocation(newLoc);
      setUserLocation(newLoc); // Update global store for other tools
    }
  };

  const handleManualLocationChange = (type: 'lat'|'lng', val: string) => {
    const num = parseFloat(val);
    setLocation(prev => {
        const next = prev ? { ...prev } : { lat: 0, lng: 0 };
        return { ...next, [type]: isNaN(num) ? 0 : num };
    });
  };

  const formatDegree = (deg: number) => {
    const d = Math.floor(deg % 30);
    const m = Math.floor((deg % 1) * 60);
    return `${d}°${m.toString().padStart(2, '0')}'`;
  };

  const handleCast = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    const lat = location?.lat ?? 51.4769;
    const lng = location?.lng ?? 0.0;
    const timestamp = new Date().toISOString();
    const analysis = await getHoraryAnalysis(question, lat, lng, timestamp);
    if (analysis) {
      setResult(analysis);
      await logCalculation('HORARY', question, analysis);
      recordCalculation();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-6 md:px-12 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-lg !px-6 !py-2 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        <div className="flex-1 w-full space-y-12">
           <header className="space-y-4">
             <h2 className="heading-marker text-6xl text-marker-blue lowercase"><GlossaryTerm word="Horary">Horary</GlossaryTerm> Moment</h2>
             <p className="handwritten text-lg text-marker-blue font-black uppercase tracking-widest">Insight into the current snapshot</p>
           </header>
           
           <div className="space-y-8">
             <textarea 
               value={question}
               onChange={(e) => setQuestion(e.target.value)}
               placeholder="Enter your inquiry..."
               className="w-full p-8 md:p-10 text-marker-black text-2xl shadow-sm italic font-black placeholder:opacity-30 border-marker-black/20 focus:border-marker-blue/40 transition-colors bg-white/50"
             />
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t-4 border-marker-black/10 pt-6 gap-4">
                <div className="space-y-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="handwritten text-sm text-marker-red font-black block uppercase tracking-tighter">Location</span>
                    <button onClick={() => setShowLocationEdit(!showLocationEdit)} className="text-xs font-bold text-marker-black/50 hover:text-marker-black underline decoration-2">
                      {showLocationEdit ? 'Done' : 'Change'}
                    </button>
                  </div>
                  
                  {showLocationEdit ? (
                    <div className="p-4 bg-white/60 marker-border border-marker-black/10 space-y-3 animate-in slide-in-from-top-2">
                       <select className="w-full p-2 bg-transparent marker-border border-marker-black/20 text-sm font-bold" onChange={handleCitySelect}>
                         {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                       </select>
                       <div className="flex gap-2">
                         <input 
                           type="number" placeholder="Lat" step="0.0001" 
                           value={location?.lat || ''} 
                           onChange={e => handleManualLocationChange('lat', e.target.value)}
                           className="w-24 p-2 bg-transparent marker-border border-marker-black/20 text-sm font-mono"
                         />
                         <input 
                           type="number" placeholder="Lng" step="0.0001" 
                           value={location?.lng || ''} 
                           onChange={e => handleManualLocationChange('lng', e.target.value)}
                           className="w-24 p-2 bg-transparent marker-border border-marker-black/20 text-sm font-mono"
                         />
                       </div>
                    </div>
                  ) : (
                    <span className="handwritten text-3xl font-black text-marker-black block">
                      {location ? `${location.lat.toFixed(3)}N / ${location.lng.toFixed(3)}E` : 'Locating...'}
                    </span>
                  )}
                </div>
                
                <div className="text-left sm:text-right space-y-1">
                  <span className="handwritten text-sm text-marker-blue font-black block uppercase tracking-tighter">System Time</span>
                  <div className="handwritten text-3xl font-black text-marker-black uppercase">{new Date().toLocaleTimeString()}</div>
                </div>
             </div>
           </div>

           <button 
             disabled={loading}
             onClick={handleCast}
             className="brutalist-button w-full !py-8 !text-2xl shadow-xl"
           >
             {loading ? 'Analyzing...' : 'Execute Inquiry'}
           </button>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[500px] md:min-h-[600px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-40">
                <div className="w-24 h-24 border-8 border-marker-blue border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-3xl text-marker-blue font-black animate-pulse italic uppercase tracking-widest">Casting Moment...</span>
             </div>
           ) : result ? (
             <div className="w-full space-y-12 pb-24 animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-6">
                   <span className="handwritten text-2xl text-marker-black font-black italic uppercase tracking-widest"><GlossaryTerm word="Chart">Projection Matrix</GlossaryTerm></span>
                   <ChartWheel ascendant={result.chartData.ascendant} planets={result.chartData.planets} aspects={result.chartData.aspects} />
                </div>

                <div className="p-10 md:p-12 marker-border border-marker-blue bg-white shadow-2xl relative">
                   <div className="flex justify-between items-start mb-6 border-b-4 border-marker-blue/10 pb-2">
                     <div className="handwritten text-sm font-black uppercase text-marker-blue tracking-widest">Synthesis</div>
                     <ReadAloudButton text={`${result.outcome}. ${result.judgment}`} className="!text-xs !py-1 !px-2 bg-marker-blue/5 border-marker-blue/20" />
                   </div>
                   <p className="heading-marker text-5xl md:text-6xl text-marker-black mb-8 leading-tight">
                     {result.outcome}
                   </p>
                   <p className="handwritten text-3xl md:text-4xl italic text-marker-black font-black leading-relaxed">"{result.judgment}"</p>
                </div>

                <div className="p-10 md:p-12 marker-border border-marker-red bg-white shadow-2xl space-y-8">
                   <div className="handwritten text-sm text-marker-red uppercase font-black border-b-4 border-marker-red/10 pb-2 tracking-widest">Technical Summary</div>
                   <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4">
                      {result.chartData.aspects.map((asp: any, idx: number) => {
                        const p1 = result.chartData.planets.find((p: any) => p.name === asp.p1);
                        const p2 = result.chartData.planets.find((p: any) => p.name === asp.p2);
                        return (
                          <div key={idx} className="flex flex-col gap-2 border-b-2 border-marker-black/5 pb-4 last:border-0">
                            <div className="flex justify-between items-center">
                              <span className="handwritten text-2xl font-black text-marker-black">
                                {asp.p1} <span className="text-marker-blue italic uppercase"><GlossaryTerm word={asp.type}>{asp.type}</GlossaryTerm></span> {asp.p2}
                              </span>
                              <span className="handwritten text-2xl text-marker-red font-black"><GlossaryTerm word="Orb">orb</GlossaryTerm>: {asp.orb.toFixed(2)}°</span>
                            </div>
                            <div className="flex justify-between handwritten text-sm text-marker-black/60 font-black uppercase tracking-widest">
                              <span>{p1 ? `${formatDegree(p1.degree)} ${p1.sign}` : '---'}</span>
                              <span>{p2 ? `${formatDegree(p2.degree)} ${p2.sign}` : '---'}</span>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                   <p className="handwritten text-3xl text-marker-black/80 pt-8 italic border-t-4 border-marker-black/10 leading-relaxed font-black">{result.technicalNotes}</p>
                </div>
             </div>
           ) : (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none">
                <div className="text-[14rem] md:text-[20rem] heading-marker text-marker-black leading-none">NOW</div>
                <p className="handwritten text-6xl font-black mt-4 uppercase tracking-tighter">awaiting inquiry...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default HoraryTool;
