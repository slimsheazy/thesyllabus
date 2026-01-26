
import React, { useState, useEffect } from 'react';
import { getBirthChartAnalysis } from '../services/geminiService';
import { useSyllabusStore } from '../store';
import { GlossaryTerm } from './GlossaryEngine';
import { logCalculation } from '../services/dbService';

const HOUSE_SYSTEMS = ['Placidus', 'Whole Sign', 'Equal House', 'Koch', 'Porphyry', 'Regiomontanus', 'Campanus'];

const GLYPHS: Record<string, string> = {
  'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀', 'Mars': '♂',
  'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '♅', 'Neptune': '♆', 'Pluto': '♇',
  'Chiron': '⚷', 'North Node': '☊', 'South Node': '☋', 'Part of Fortune': '⊗',
  'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋', 'Leo': '♌', 'Virgo': '♍',
  'Libra': '♎', 'Scorpio': '♏', 'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
};

const ZODIAC_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const CITIES = [
  { name: "Auto-Fill City...", lat: "", lng: "" },
  { name: "New York, USA", lat: "40.7128", lng: "-74.0060" },
  { name: "London, UK", lat: "51.5074", lng: "-0.1278" },
  { name: "Tokyo, Japan", lat: "35.6762", lng: "139.6503" },
  { name: "Los Angeles, USA", lat: "34.0522", lng: "-118.2437" },
  { name: "Sydney, Australia", lat: "-33.8688", lng: "151.2093" },
  { name: "Paris, France", lat: "48.8566", lng: "2.3522" },
  { name: "Berlin, Germany", lat: "52.5200", lng: "13.4050" },
  { name: "Mexico City, Mexico", lat: "19.4326", lng: "-99.1332" },
  { name: "Mumbai, India", lat: "19.0760", lng: "72.8777" },
  { name: "Beijing, China", lat: "39.9042", lng: "116.4074" },
  { name: "Cairo, Egypt", lat: "30.0444", lng: "31.2357" },
  { name: "Rio de Janeiro, Brazil", lat: "-22.9068", lng: "-43.1729" },
  { name: "Moscow, Russia", lat: "55.7558", lng: "37.6173" },
  { name: "Dubai, UAE", lat: "25.2048", lng: "55.2708" },
  { name: "Singapore", lat: "1.3521", lng: "103.8198" },
  { name: "Toronto, Canada", lat: "43.6510", lng: "-79.3470" },
  { name: "Chicago, USA", lat: "41.8781", lng: "-87.6298" },
  { name: "San Francisco, USA", lat: "37.7749", lng: "-122.4194" }
];

const NatalWheel: React.FC<{ data: any }> = ({ data }) => {
  if (!data || !data.ascendant || !data.houses) return null;

  const size = 400;
  const center = size / 2;
  const radiusOuter = size * 0.45;
  const radiusInner = size * 0.35;
  
  // Calculate Ascendant angle offset. 
  // In a chart, Ascendant (House 1 Cusp) is usually fixed at 9 o'clock (180 deg in SVG terms, or we rotate everything).
  // Strategy: Map 0 Aries to 0 degrees. Rotate entire wheel so Ascendant is at 9 o'clock.
  const ascSignIndex = ZODIAC_ORDER.indexOf(data.ascendant.sign);
  const ascAbsDegree = (ascSignIndex * 30) + data.ascendant.degree;
  
  // Rotation needed to bring Ascendant to 180 deg (Left/9 o'clock)
  // SVG 0 is 3 o'clock. 180 is 9 o'clock.
  // We want ascAbsDegree to point to 180.
  const rotationOffset = 180 - ascAbsDegree;

  const getCoordinates = (deg: number, r: number) => {
    const rad = (deg + rotationOffset) * (Math.PI / 180);
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad)
    };
  };

  return (
    <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
         {/* Zodiac Ring Background */}
         <circle cx={center} cy={center} r={radiusOuter} fill="none" stroke="var(--marker-black)" strokeWidth="1" strokeOpacity="0.5" />
         <circle cx={center} cy={center} r={radiusInner} fill="none" stroke="var(--marker-black)" strokeWidth="1" strokeOpacity="0.5" />

         {/* Signs */}
         {ZODIAC_ORDER.map((sign, i) => {
           // Each sign is 30 degrees
           const startDeg = i * 30;
           const midDeg = startDeg + 15;
           const p1 = getCoordinates(startDeg, radiusOuter);
           const p2 = getCoordinates(startDeg, radiusInner);
           const labelPos = getCoordinates(midDeg, (radiusOuter + radiusInner) / 2);
           
           return (
             <g key={sign}>
               <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--marker-black)" strokeOpacity="0.2" />
               <text 
                 x={labelPos.x} y={labelPos.y} 
                 textAnchor="middle" dominantBaseline="middle" 
                 fontSize="14" fill="var(--marker-black)"
                 className="select-none"
               >
                 {GLYPHS[sign]}
               </text>
             </g>
           );
         })}

         {/* Houses Cusps */}
         {data.houses.map((house: any) => {
            const signIdx = ZODIAC_ORDER.indexOf(house.sign);
            const absDeg = (signIdx * 30) + house.degree;
            const p1 = getCoordinates(absDeg, radiusInner);
            const p2 = getCoordinates(absDeg, radiusInner - 40); // House lines go inward
            
            // House Number Label
            // Approximate middle of house by looking at next house cusp
            const nextHouse = data.houses.find((h: any) => h.house === (house.house % 12) + 1);
            const nextSignIdx = ZODIAC_ORDER.indexOf(nextHouse.sign);
            let nextAbsDeg = (nextSignIdx * 30) + nextHouse.degree;
            if (nextAbsDeg < absDeg) nextAbsDeg += 360;
            
            const midHouseDeg = (absDeg + nextAbsDeg) / 2;
            const numPos = getCoordinates(midHouseDeg, radiusInner - 25);

            return (
              <g key={`h-${house.house}`}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--marker-blue)" strokeWidth={house.house % 3 === 1 ? 2 : 1} strokeOpacity="0.6" />
                <text 
                  x={numPos.x} y={numPos.y} 
                  textAnchor="middle" dominantBaseline="middle" 
                  fontSize="10" fill="var(--marker-blue)" opacity="0.7"
                  className="handwritten font-bold select-none"
                >
                  {house.house}
                </text>
              </g>
            );
         })}

         {/* Planets */}
         {data.planets.map((planet: any, i: number) => {
            const signIdx = ZODIAC_ORDER.indexOf(planet.sign);
            const absDeg = (signIdx * 30) + planet.degree;
            
            // Simple collision avoidance: Stagger radius slightly based on index
            const rPlanet = (radiusInner - 60) + (i % 3) * 12; 
            const pos = getCoordinates(absDeg, rPlanet);
            
            // Aspect lines could go here if we wanted a mess of lines
            
            return (
              <g key={planet.planet} className="group cursor-help">
                 <line x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="var(--marker-black)" strokeOpacity="0.1" strokeDasharray="2,2" />
                 <circle cx={pos.x} cy={pos.y} r="8" fill="white" stroke="var(--marker-black)" strokeWidth="1" />
                 <text 
                   x={pos.x} y={pos.y} 
                   textAnchor="middle" dominantBaseline="middle" dy="1"
                   fontSize="12" fill={planet.retrograde ? "var(--marker-red)" : "var(--marker-black)"}
                   className="select-none font-bold"
                 >
                   {GLYPHS[planet.planet] || planet.planet[0]}
                 </text>
                 <title>{planet.planet} in {planet.sign} {planet.degree.toFixed(2)}° (House {planet.house}) {planet.retrograde ? 'Rx' : ''}</title>
              </g>
            );
         })}

         {/* Center */}
         <circle cx={center} cy={center} r="4" fill="var(--marker-black)" />
      </svg>
      
      {/* Ascendant Marker (Visual Aid) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-marker-black text-white text-xs px-1 font-bold rounded">AC</div>
    </div>
  );
};

const BirthChartTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputs, setInputs] = useState({
    date: '',
    time: '',
    lat: '',
    lng: ''
  });
  const [settings, setSettings] = useState({
    houseSystem: 'Placidus',
    nodeType: 'True',
    includeChiron: true,
    aspectSet: 'Standard'
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  
  const { recordCalculation, setUserLocation } = useSyllabusStore();

  const handleLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
            setInputs(prev => ({ ...prev, lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) }));
            // Also save to global store for other tools
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => alert("Could not retrieve location. Please enter manually.")
      );
    }
  };
  
  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CITIES.find(c => c.name === e.target.value);
    if (selected && selected.lat) {
      setInputs(prev => ({ ...prev, lat: selected.lat, lng: selected.lng }));
    }
  };

  const handleCalculate = async () => {
    if (!inputs.date || !inputs.time || !inputs.lat || !inputs.lng) {
      alert("All coordinate data is required.");
      return;
    }

    setLoading(true);
    setChartData(null);

    const result = await getBirthChartAnalysis({
      date: inputs.date,
      time: inputs.time,
      lat: parseFloat(inputs.lat),
      lng: parseFloat(inputs.lng),
      settings
    });

    if (result) {
      setChartData(result);
      await logCalculation('NATAL_ENGINE', `${inputs.date} ${inputs.time}`, result);
      recordCalculation();
    } else {
      alert("Chart generation failed. The cosmic connection was interrupted. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-[1600px] mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col xl:flex-row gap-16 items-start">
        {/* LEFT COLUMN: Controls */}
        <div className="w-full xl:w-[450px] space-y-12 xl:sticky xl:top-20 z-10">
           <header className="space-y-2">
             <h2 className="heading-marker text-6xl text-marker-black lowercase leading-none"><GlossaryTerm word="Natal Chart">Natal</GlossaryTerm> Engine</h2>
             <p className="handwritten text-lg text-marker-black opacity-60 font-bold uppercase tracking-widest">Constructing the Self</p>
             <div className="w-full h-px bg-marker-black/20 mt-4"></div>
           </header>

           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">Date of Origin</label>
                    <input 
                      type="date"
                      value={inputs.date}
                      onChange={e => setInputs({...inputs, date: e.target.value})}
                      className="w-full p-4 marker-border bg-white/50 text-2xl font-mono text-marker-black focus:border-marker-blue outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">Time (Local)</label>
                    <input 
                      type="time"
                      value={inputs.time}
                      onChange={e => setInputs({...inputs, time: e.target.value})}
                      className="w-full p-4 marker-border bg-white/50 text-2xl font-mono text-marker-black focus:border-marker-blue outline-none"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">Spatial Coordinates</label>
                   <button onClick={handleLocate} className="text-marker-blue text-xs font-bold uppercase hover:underline flex items-center gap-1">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a3 3 0 0 0-3 3v14a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/></svg>
                     <span>GPS</span>
                   </button>
                </div>
                
                {/* City Dropdown */}
                <select 
                  className="w-full p-3 marker-border bg-white/50 text-base font-mono text-marker-black mb-2 focus:border-marker-blue outline-none"
                  onChange={handleCitySelect}
                >
                  {CITIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" placeholder="Lat" step="0.0001"
                    value={inputs.lat}
                    onChange={e => setInputs({...inputs, lat: e.target.value})}
                    className="w-full p-4 marker-border bg-white/50 text-2xl font-mono text-marker-black focus:border-marker-blue outline-none"
                  />
                  <input 
                    type="number" placeholder="Lng" step="0.0001"
                    value={inputs.lng}
                    onChange={e => setInputs({...inputs, lng: e.target.value})}
                    className="w-full p-4 marker-border bg-white/50 text-2xl font-mono text-marker-black focus:border-marker-blue outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-full text-left py-2 px-4 border-l-2 border-marker-black/20 hover:border-marker-black transition-colors handwritten text-sm font-bold uppercase tracking-widest text-marker-black/60 hover:text-marker-black"
              >
                {showSettings ? '[-] Collapse Protocols' : '[+] Configure Protocols'}
              </button>

              {showSettings && (
                <div className="p-6 bg-marker-black/5 marker-border border-marker-black/10 space-y-4 animate-in slide-in-from-top-2">
                   <div className="space-y-2">
                      <label className="handwritten text-xs font-bold uppercase">House System</label>
                      <div className="flex flex-wrap gap-2">
                         {HOUSE_SYSTEMS.map(sys => (
                           <button 
                             key={sys}
                             onClick={() => setSettings({...settings, houseSystem: sys})}
                             className={`px-3 py-1 text-xs border ${settings.houseSystem === sys ? 'bg-marker-black text-white border-marker-black' : 'bg-white border-marker-black/20 text-marker-black'} transition-colors`}
                           >
                             {sys}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              <button 
                onClick={handleCalculate}
                disabled={loading}
                className="brutalist-button w-full !py-6 !text-2xl mt-4 shadow-xl border-marker-black"
              >
                {loading ? 'Computing Ephemeris...' : 'Generate Natal Matrix'}
              </button>
           </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="flex-1 w-full min-h-[800px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-20 xl:mt-40">
                <div className="w-24 h-24 border-8 border-marker-black border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-3xl text-marker-black font-black animate-pulse italic uppercase tracking-widest">Aligning Celestial Spheres...</span>
             </div>
           ) : chartData ? (
             <div className="w-full space-y-16 animate-in fade-in duration-700 pb-32">
                
                {/* Header & Wheel */}
                <div className="flex flex-col xl:flex-row items-center gap-12 border-b-4 border-marker-black/5 pb-12">
                   <div className="flex-1">
                      <NatalWheel data={chartData} />
                   </div>
                   <div className="w-full xl:w-1/3 space-y-6">
                      <div className="p-6 marker-border border-marker-black bg-white shadow-lg">
                         <span className="handwritten text-xs font-bold uppercase text-marker-black/40 tracking-widest block mb-2">Ascendant / Rising</span>
                         <div className="heading-marker text-5xl text-marker-black leading-none">{chartData.ascendant.sign}</div>
                         <div className="handwritten text-xl text-marker-black/60 font-mono">{chartData.ascendant.degree.toFixed(2)}°</div>
                      </div>
                      <div className="p-6 marker-border border-marker-black/20 bg-white/50">
                         <span className="handwritten text-xs font-bold uppercase text-marker-black/40 tracking-widest block mb-2">Chart Ruler</span>
                         <div className="heading-marker text-3xl text-marker-black leading-none italic">
                           {/* Simple logic: Ruler of Ascendant sign - could be expanded in future */}
                           (Calculated via Ascendant)
                         </div>
                      </div>
                   </div>
                </div>

                {/* Core Synthesis */}
                <div className="space-y-6">
                   <h3 className="heading-marker text-5xl text-marker-black lowercase">Core Synthesis</h3>
                   <div className="p-10 marker-border border-marker-blue bg-white/60 shadow-xl">
                      <p className="handwritten text-2xl md:text-3xl text-marker-black italic leading-relaxed font-medium">
                        "{chartData.interpretation.final_synthesis}"
                      </p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 marker-border border-marker-black/10 bg-white/40">
                         <span className="handwritten text-xs font-bold uppercase text-marker-black/40 tracking-widest block mb-4">Overall Theme</span>
                         <p className="handwritten text-lg text-marker-black leading-relaxed">{chartData.interpretation.overall_chart_theme}</p>
                      </div>
                      <div className="p-8 marker-border border-marker-black/10 bg-white/40">
                         <span className="handwritten text-xs font-bold uppercase text-marker-black/40 tracking-widest block mb-4">Planetary Dynamics</span>
                         <ul className="space-y-3">
                           {Object.entries(chartData.interpretation.planetary_themes).slice(0,3).map(([key, val]: any) => (
                             <li key={key} className="text-sm border-b border-marker-black/5 pb-2">
                               <span className="font-bold uppercase text-marker-black mr-2">{key}:</span> 
                               <span className="italic text-marker-black/70">{val}</span>
                             </li>
                           ))}
                         </ul>
                      </div>
                   </div>
                </div>

                {/* Planets Table */}
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                     <h3 className="heading-marker text-4xl text-marker-black lowercase">Planetary Positions</h3>
                     <div className="h-px bg-marker-black/10 flex-grow"></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {chartData.planets.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 marker-border border-marker-black/10 bg-white/30 hover:border-marker-blue/50 transition-colors">
                           <div className="w-10 h-10 flex items-center justify-center bg-marker-black text-white rounded-full text-xl font-bold shrink-0">
                             {GLYPHS[p.planet] || p.planet[0]}
                           </div>
                           <div>
                              <div className="font-bold text-marker-black uppercase text-sm tracking-wide">{p.planet}</div>
                              <div className="text-xs font-mono text-marker-black/60">
                                {p.degree.toFixed(2)}° {p.sign} {p.retrograde && <span className="text-marker-red font-bold">Rx</span>}
                              </div>
                              <div className="text-[10px] uppercase tracking-widest text-marker-blue/70 font-bold">House {p.house}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Aspects */}
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                     <h3 className="heading-marker text-4xl text-marker-black lowercase">Major Aspects</h3>
                     <div className="h-px bg-marker-black/10 flex-grow"></div>
                   </div>
                   <div className="max-h-[400px] overflow-y-auto p-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="handwritten text-xs uppercase text-marker-black/40 tracking-widest border-b-2 border-marker-black/10">
                            <th className="pb-2 pl-2">Planet A</th>
                            <th className="pb-2">Aspect</th>
                            <th className="pb-2">Planet B</th>
                            <th className="pb-2 text-right pr-2">Orb</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.aspects.map((asp: any, i: number) => (
                            <tr key={i} className="border-b border-marker-black/5 hover:bg-marker-black/5 transition-colors">
                              <td className="py-3 pl-2 font-bold text-marker-black">{asp.planet1}</td>
                              <td className="py-3 text-marker-blue italic font-bold">{asp.aspect}</td>
                              <td className="py-3 font-bold text-marker-black">{asp.planet2}</td>
                              <td className="py-3 text-right pr-2 font-mono text-xs">{asp.orb.toFixed(2)}°</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>

             </div>
           ) : (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-20 xl:mt-40 select-none">
                <div className="text-[12rem] xl:text-[16rem] heading-marker text-marker-black leading-none">SELF</div>
                <p className="handwritten text-4xl font-black mt-4 uppercase tracking-tighter">awaiting birth data...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default BirthChartTool;
