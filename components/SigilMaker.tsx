
import React, { useState, useMemo } from 'react';
import { generateSigil } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';

const FEELINGS = ["clarity", "protection", "abundance", "transformation", "serenity", "power"];

const SigilMaker: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [intention, setIntention] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState('clarity');
  const [sigilUrl, setSigilUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Extract consonants to show "work" (Legit method)
  const distilled = useMemo(() => {
    if (!intention) return "";
    const clean = intention.toUpperCase().replace(/[^A-Z]/g, '');
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const unique = new Set();
    for (const c of clean) {
      if (!vowels.includes(c)) unique.add(c);
    }
    return Array.from(unique).join(' ');
  }, [intention]);

  const handleSynthesize = async () => {
    if (!intention.trim()) return;
    setLoading(true);
    setSigilUrl(null);
    const url = await generateSigil(intention, selectedFeeling);
    setSigilUrl(url);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col lg:flex-row gap-16 items-start">
        <div className="flex-1 w-full space-y-12">
           <header className="space-y-2">
             <h2 className="heading-marker text-6xl text-marker-teal lowercase"><GlossaryTerm word="Sigil">Sigil</GlossaryTerm> Engine</h2>
             <p className="handwritten text-lg text-marker-teal opacity-60"><GlossaryTerm word="Austin Osman Spare">Austin Osman Spare</GlossaryTerm> Method</p>
           </header>
           
           <div className="space-y-10">
             <div className="space-y-2">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2">Manifestation Goal</label>
               <input 
                  type="text" 
                  placeholder="I am..."
                  className="w-full p-8 text-marker-black text-2xl shadow-sm italic placeholder:opacity-25"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                />
             </div>

             {/* Live Extraction Display */}
             <div className="p-6 marker-border border-marker-black/10 bg-white/30 transition-all duration-300">
                <label className="handwritten text-xs text-marker-black opacity-40 block mb-2 uppercase tracking-widest">Sigil Core (Consonants)</label>
                <div className="heading-marker text-4xl text-marker-black tracking-[0.2em] h-12">
                   {distilled || <span className="opacity-10 text-xl tracking-normal">awaiting input...</span>}
                </div>
             </div>

             <div className="space-y-4">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2">Emotional Tone</label>
               <div className="flex flex-wrap gap-3">
                 {FEELINGS.map(f => (
                   <button
                    key={f}
                    onClick={() => setSelectedFeeling(f)}
                    className={`px-6 py-2 marker-border handwritten text-sm font-bold tracking-widest transition-all ${
                      selectedFeeling === f ? 'bg-marker-teal/10 border-marker-teal text-marker-teal' : 'border-marker-black/10 text-marker-black opacity-40 hover:opacity-100'
                    }`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
             </div>

             <button 
                onClick={handleSynthesize}
                disabled={loading}
                className="brutalist-button w-full !py-8 !text-2xl mt-4"
              >
                {loading ? 'Constructing Glyph...' : 'Draw Pattern'}
              </button>
           </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[600px]">
           {loading && (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-40">
                <div className="w-20 h-20 border-4 border-marker-teal border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-xl text-marker-teal animate-pulse italic">Fusing Forms...</span>
             </div>
           )}

           {sigilUrl ? (
             <div className="w-full flex flex-col items-center gap-10 animate-in fade-in duration-1000 pb-16">
                
                {/* Visual Enhancement for Sigil Output */}
                <div className="relative group max-w-md w-full cursor-zoom-in" onClick={() => window.open(sigilUrl, '_blank')} title="View Full Size">
                  {/* Offset Block Shadow */}
                  <div className="absolute inset-0 bg-marker-black translate-x-3 translate-y-3 rounded-lg opacity-10 transition-transform duration-300 group-hover:translate-x-4 group-hover:translate-y-4"></div>
                  
                  {/* Main Card */}
                  <div className="relative z-10 bg-white border-2 border-marker-black rounded-lg p-10 overflow-hidden shadow-2xl transition-transform duration-300 group-hover:-translate-y-1">
                    
                    {/* Glossy Sheen (Top-Left Light Source) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-transparent to-black/5 pointer-events-none z-20 opacity-80"></div>
                    
                    {/* Image */}
                    <img 
                      src={sigilUrl} 
                      alt="Synthesized Sigil" 
                      className="w-full aspect-square object-contain contrast-125 relative z-10 mix-blend-multiply opacity-90"
                    />

                    {/* Clean Minimalist Inner Border */}
                    <div className="absolute inset-5 border border-marker-black/10 rounded-sm z-20 pointer-events-none"></div>
                    
                    {/* Technical Corners */}
                    <div className="absolute top-3 left-3 w-1.5 h-1.5 border-t border-l border-marker-black/30 z-20"></div>
                    <div className="absolute top-3 right-3 w-1.5 h-1.5 border-t border-r border-marker-black/30 z-20"></div>
                    <div className="absolute bottom-3 left-3 w-1.5 h-1.5 border-b border-l border-marker-black/30 z-20"></div>
                    <div className="absolute bottom-3 right-3 w-1.5 h-1.5 border-b border-r border-marker-black/30 z-20"></div>
                  </div>
                </div>
                
                <div className="text-center space-y-6">
                  <p className="handwritten text-lg text-marker-black/40 italic">Glyph Activated.</p>
                  <a 
                    href={sigilUrl} 
                    download="sigil.png"
                    className="brutalist-button !text-sm !py-3 !px-8 hover:!bg-marker-black/5"
                  >
                    Save Image
                  </a>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none">
                <div className="text-[10rem] heading-marker text-marker-black leading-none">SEAL</div>
                <p className="handwritten text-2xl mt-4">awaiting intent...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SigilMaker;
