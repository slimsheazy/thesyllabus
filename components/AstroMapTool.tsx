
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { getRelocationAnalysis } from '../services/geminiService';
import { useSyllabusStore } from '../store';
import { GlossaryTerm } from './GlossaryEngine';
import { ReadAloudButton } from './ReadAloudButton';

// Fix for default Leaflet marker icons in React
import L from 'leaflet';
// We are using a custom divIcon or simple circle marker to avoid asset 404s
const createCustomIcon = () => L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color: var(--marker-red); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const LocationMarker: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createCustomIcon()}>
      <Popup>Target Coordinates: {position.lat.toFixed(2)}, {position.lng.toFixed(2)}</Popup>
    </Marker>
  );
};

const AstroMapTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<{ lat: number, lng: number } | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { isEclipseMode } = useSyllabusStore();

  const handleLocationSelect = async (lat: number, lng: number) => {
    if (!birthDate || !birthTime) {
      alert("Please enter birth data first.");
      return;
    }
    
    setSelectedLoc({ lat, lng });
    setLoading(true);
    setAnalysis(null);

    const result = await getRelocationAnalysis(birthDate, birthTime, lat, lng);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-900">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-[1000] bg-white text-black"
      >
        Index
      </button>

      <div className="flex flex-col h-screen lg:flex-row">
        {/* Left Panel: Controls & Analysis */}
        <div className="w-full lg:w-[400px] h-1/3 lg:h-full bg-white z-[900] overflow-y-auto flex flex-col shadow-2xl">
          <div className="p-8 space-y-8 flex-grow">
            <header className="space-y-2">
               <h2 className="heading-marker text-5xl text-marker-black lowercase"><GlossaryTerm word="Astrocartography">Relocation</GlossaryTerm> Mapper</h2>
               <p className="handwritten text-sm text-marker-black opacity-60 uppercase tracking-widest">Global Angularity Finder</p>
            </header>

            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
               <div className="space-y-1">
                 <label className="handwritten text-xs font-bold uppercase text-marker-black/40">Birth Date</label>
                 <input 
                   type="date" 
                   value={birthDate} 
                   onChange={(e) => setBirthDate(e.target.value)}
                   className="w-full bg-transparent border-b border-marker-black/20 text-lg font-mono focus:outline-none focus:border-marker-blue"
                 />
               </div>
               <div className="space-y-1">
                 <label className="handwritten text-xs font-bold uppercase text-marker-black/40">Birth Time</label>
                 <input 
                   type="time" 
                   value={birthTime} 
                   onChange={(e) => setBirthTime(e.target.value)}
                   className="w-full bg-transparent border-b border-marker-black/20 text-lg font-mono focus:outline-none focus:border-marker-blue"
                 />
               </div>
               {!birthDate && <p className="text-xs text-marker-red italic">Required for calculation</p>}
            </div>

            {loading && (
               <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="w-10 h-10 border-2 border-marker-black border-t-transparent animate-spin rounded-full"></div>
                  <span className="handwritten text-sm uppercase tracking-widest animate-pulse">Calculating Angles...</span>
               </div>
            )}

            {analysis && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                  
                  {/* Primary Influence */}
                  <div className="space-y-2">
                     <span className="handwritten text-xs font-bold uppercase text-marker-blue tracking-widest">Dominant Line</span>
                     {analysis.angles.length > 0 ? (
                       analysis.angles.map((a: any, i: number) => (
                         <div key={i} className="flex items-center gap-2">
                            <span className="heading-marker text-4xl text-marker-black">{a.planet}</span>
                            <span className="handwritten text-lg font-bold text-marker-black/50">on the {a.angle}</span>
                         </div>
                       ))
                     ) : (
                       <div className="heading-marker text-2xl text-marker-black">{analysis.dominantInfluence}</div>
                     )}
                  </div>

                  {/* Themes */}
                  <div className="flex flex-wrap gap-2">
                     {analysis.themes.map((t: string, i: number) => (
                       <span key={i} className="px-2 py-1 bg-marker-black/5 text-xs font-bold uppercase tracking-wide rounded-sm">{t}</span>
                     ))}
                  </div>

                  {/* Vibe Check */}
                  <div className="p-6 bg-slate-900 text-white rounded-lg shadow-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                     </div>
                     <div className="flex justify-between items-start mb-4">
                        <span className="handwritten text-xs font-bold uppercase tracking-widest text-slate-400">Location Vibe</span>
                        <ReadAloudButton text={analysis.vibeCheck} className="!text-black !bg-white !py-1 !px-2 !text-xs border-transparent" />
                     </div>
                     <p className="handwritten text-lg leading-relaxed italic opacity-90">
                        "{analysis.vibeCheck}"
                     </p>
                  </div>
               </div>
            )}
            
            {!analysis && !loading && (
               <div className="opacity-30 text-center py-10">
                  <p className="handwritten text-xl italic">Select a location on the map...</p>
               </div>
            )}
          </div>
        </div>

        {/* Right Panel: Map */}
        <div className="w-full lg:w-2/3 h-2/3 lg:h-full relative z-[1]">
          <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} className="w-full h-full" minZoom={2}>
            {/* Dark Matter Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={isEclipseMode 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              }
            />
            <LocationMarker onLocationSelect={handleLocationSelect} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AstroMapTool;
