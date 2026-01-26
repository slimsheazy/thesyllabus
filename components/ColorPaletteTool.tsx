
import React, { useState } from 'react';
import { getColorPalette } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { logCalculation } from '../services/dbService';
import { useSyllabusStore } from '../store';

const ColorPaletteTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [vibe, setVibe] = useState('');
  const [date, setDate] = useState('');
  const [mode, setMode] = useState<'date' | 'vibe'>('vibe');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { recordCalculation } = useSyllabusStore();

  const handleGenerate = async () => {
    const input = mode === 'vibe' ? vibe : date;
    if (!input) return;
    
    setLoading(true);
    setResult(null);
    const data = await getColorPalette(input, mode);
    
    if (data) {
      setResult(data);
      await logCalculation('COLOR_PALETTE', `${mode}:${input}`, data);
      recordCalculation();
    }
    setLoading(false);
  };

  const layers = ['Root', 'Aether', 'Flare'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-[1600px] mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-lg !px-6 !py-2 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col xl:flex-row gap-16 items-start">
        <div className="w-full xl:w-[450px] space-y-12 xl:sticky xl:top-20">
           <header className="space-y-4">
             <h2 className="heading-marker text-6xl text-marker-blue lowercase leading-none"><GlossaryTerm word="Zodiac">Zodiacal</GlossaryTerm> Palette</h2>
             <p className="handwritten text-lg text-marker-blue font-black uppercase tracking-widest"><GlossaryTerm word="Chromatic">Chromatic</GlossaryTerm> mapping of energy</p>
             <div className="w-32 h-2 bg-marker-blue/20 marker-border"></div>
           </header>
           
           <div className="space-y-10">
             <div className="flex gap-4">
                <button 
                  onClick={() => setMode('vibe')}
                  className={`flex-1 py-4 marker-border handwritten text-sm font-black tracking-widest transition-all ${mode === 'vibe' ? 'bg-marker-blue/10 border-marker-blue text-marker-blue' : 'border-marker-black/20 text-marker-black opacity-40 hover:opacity-100'}`}
                >
                  By Vibe
                </button>
                <button 
                  onClick={() => setMode('date')}
                  className={`flex-1 py-4 marker-border handwritten text-sm font-black tracking-widest transition-all ${mode === 'date' ? 'bg-marker-blue/10 border-marker-blue text-marker-blue' : 'border-marker-black/20 text-marker-black opacity-40 hover:opacity-100'}`}
                >
                  By Date
                </button>
             </div>

             <div className="space-y-4">
               <label className="handwritten text-sm text-marker-black font-black block ml-2 uppercase tracking-[0.2em]">
                 {mode === 'vibe' ? 'Input: Essence Vibe' : 'Input: Temporal Node'}
               </label>
               {mode === 'vibe' ? (
                 <input 
                    type="text" 
                    placeholder="Enter the vibe..."
                    className="w-full p-8 text-marker-black text-2xl shadow-sm italic placeholder:opacity-40 bg-white/50 border-2 border-marker-black/5 rounded-xl focus:border-marker-blue focus:outline-none transition-all"
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                  />
               ) : (
                 <input 
                    type="date" 
                    className="w-full p-8 text-marker-black text-2xl shadow-sm italic bg-white/50 border-2 border-marker-black/5 rounded-xl focus:border-marker-blue focus:outline-none transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
               )}
             </div>

             <button 
                onClick={handleGenerate}
                disabled={loading}
                className="brutalist-button w-full !py-8 !text-2xl shadow-xl mt-4 relative group overflow-hidden"
              >
                <span className="relative z-10">{loading ? 'Synthesizing Spectrum...' : 'Generate 12-Layer Matrix'}</span>
                {loading && <div className="absolute inset-0 bg-marker-blue/5 animate-pulse"></div>}
              </button>
           </div>
        </div>

        <div className="flex-1 w-full min-h-[700px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-10 mt-40">
                <div className="relative">
                  <div className="w-32 h-32 border-8 border-marker-blue/10 rounded-full"></div>
                  <div className="absolute inset-0 w-32 h-32 border-8 border-marker-blue border-t-transparent animate-spin rounded-full"></div>
                </div>
                <span className="handwritten text-4xl text-marker-blue font-black animate-pulse italic uppercase tracking-widest">Analyzing <GlossaryTerm word="Density">Chromatic Density</GlossaryTerm>...</span>
             </div>
           ) : result ? (
             <div className="w-full space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-32">
                
                {/* Palette Summary */}
                <div className="p-12 marker-border border-marker-blue bg-white shadow-2xl space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-marker-blue"></div>
                  <div className="handwritten text-sm font-black uppercase tracking-[0.4em] text-marker-blue"><GlossaryTerm word="Spectrum">Spectrum</GlossaryTerm> Analysis Report</div>
                  <p className="handwritten text-3xl italic text-marker-black font-black leading-relaxed">
                    "{result.analysis}"
                  </p>
                  <div className="flex items-center gap-6 pt-4 border-t-4 border-marker-black/5">
                    <span className="handwritten text-xl font-black text-marker-red uppercase tracking-widest"><GlossaryTerm word="Elemental">Elemental</GlossaryTerm> Gap:</span>
                    <span className="heading-marker text-5xl text-marker-black lowercase">{result.deficiency}</span>
                  </div>
                </div>

                {/* Expansive Matrix */}
                {layers.map(layerName => {
                  const layerColors = result.colors.filter((c: any) => c.layer === layerName || c.layer.toLowerCase().includes(layerName.toLowerCase()));
                  return (
                    <div key={layerName} className="space-y-8">
                      <div className="flex items-center gap-6">
                        <span className="handwritten text-2xl font-black text-marker-black uppercase tracking-[0.3em] shrink-0 italic">The {layerName} Matrix</span>
                        <div className="h-px bg-marker-black/10 flex-grow"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {layerColors.length > 0 ? layerColors.map((color: any, idx: number) => (
                          <div key={idx} className="group relative">
                             <div 
                                className="h-64 w-full marker-border border-marker-black/20 shadow-xl mb-4 group-hover:-translate-y-3 transition-transform duration-500 relative"
                                style={{ backgroundColor: color.hex }}
                             >
                               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                               <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 marker-border border-marker-black/10 handwritten text-sm font-black tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                 {color.hex}
                               </div>
                             </div>
                             <div className="p-6 marker-border border-marker-black/5 bg-white/40 group-hover:border-marker-blue transition-all min-h-[160px]">
                                <div className="handwritten text-[10px] text-marker-black/30 mb-2 italic uppercase tracking-widest font-bold">Node {idx+1}</div>
                                <div className="heading-marker text-3xl text-marker-black leading-tight lowercase mb-3">{color.name}</div>
                                <p className="handwritten text-sm text-marker-black/70 italic leading-relaxed font-bold">"{color.reasoning}"</p>
                             </div>
                          </div>
                        )) : (
                          <div className="col-span-full py-12 text-center handwritten text-2xl opacity-20 italic">Layer under-saturated in current query...</div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Technical Appendix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   <div className="lg:col-span-2 p-12 marker-border border-marker-black/10 bg-white/20 space-y-6">
                      <div className="handwritten text-sm font-black uppercase tracking-widest border-b-2 border-marker-black/10 pb-4 text-marker-black/40 italic">Structural Synthesis</div>
                      <p className="handwritten text-2xl text-marker-black font-black italic leading-relaxed">
                         {result.technicalSynthesis}
                      </p>
                   </div>
                   <div className="p-12 text-center marker-border border-marker-green bg-white shadow-xl flex flex-col items-center justify-center group relative overflow-hidden">
                      <div className="absolute inset-0 bg-marker-green/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="handwritten text-xl text-marker-green font-black uppercase mb-4 italic tracking-[0.3em]">Status</div>
                        <p className="heading-marker text-6xl text-marker-black lowercase group-hover:scale-110 transition-transform">Harmonized.</p>
                      </div>
                   </div>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none">
                <div className="text-[14rem] heading-marker text-marker-black leading-none select-none opacity-40">CHROMA</div>
                <p className="handwritten text-5xl font-black mt-4 uppercase tracking-tighter italic">awaiting input signature...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ColorPaletteTool;
