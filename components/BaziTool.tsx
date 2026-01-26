
import React, { useState } from 'react';
import { getBaziAnalysis } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { ReadAloudButton } from './ReadAloudButton';

const BaziTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number | null>(null);

  const calculateBazi = async () => {
    if (!birthDate) return;
    setLoading(true);
    setResult(null);
    setSelectedPillarIndex(null);
    const analysis = await getBaziAnalysis(birthDate, birthTime || "00:00");
    setResult(analysis);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 md:py-32 px-4 md:px-12 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-6 !py-2 z-50 bg-white shadow-xl"
      >
        Index
      </button>

      <div className="w-full flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
        {/* Left Column: Configuration */}
        <div className="w-full lg:w-[400px] space-y-16 lg:sticky lg:top-40 z-10">
           <header className="space-y-4">
             <h2 className="heading-marker text-6xl text-marker-red lowercase leading-none"><GlossaryTerm word="Four Pillars of Destiny">Four Pillars</GlossaryTerm></h2>
             <p className="handwritten text-lg text-marker-red/60 italic"><GlossaryTerm word="Archetype">Archetypal</GlossaryTerm> Destiny Engine</p>
             <div className="w-20 h-1 bg-marker-red/20 marker-border"></div>
           </header>
           
           <div className="space-y-12">
             <div className="space-y-6">
               <div className="group relative z-20">
                 <label className="handwritten text-sm text-marker-black opacity-40 block ml-2 uppercase tracking-[0.2em] mb-3">Temporal Coordinate: Date</label>
                 <input 
                    type="date" 
                    className="w-full p-6 text-marker-black text-2xl shadow-sm italic bg-white/50 border-2 border-transparent focus:border-marker-red/20 outline-none transition-all rounded-xl relative z-20"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
               </div>
               
               <div className="group relative z-20">
                 <label className="handwritten text-sm text-marker-black opacity-40 block ml-2 uppercase tracking-[0.2em] mb-3">Temporal Coordinate: Time</label>
                 <input 
                    type="time" 
                    className="w-full p-6 text-marker-black text-2xl shadow-sm italic bg-white/50 border-2 border-transparent focus:border-marker-red/20 outline-none transition-all rounded-xl relative z-20"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                  />
               </div>
             </div>

             <button 
                onClick={calculateBazi}
                disabled={loading}
                className="brutalist-button w-full !py-8 !text-2xl shadow-xl mt-6 group overflow-hidden relative z-10"
              >
                <span className="relative z-10">{loading ? 'Casting Grid...' : 'Calculate Pillars'}</span>
                {loading && <div className="absolute inset-0 bg-marker-red/5 animate-pulse"></div>}
              </button>
           </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex-1 w-full min-h-[600px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-10 mt-32">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-marker-red/10 rounded-full"></div>
                  <div className="absolute inset-0 w-24 h-24 border-4 border-marker-red border-t-transparent animate-spin rounded-full"></div>
                </div>
                <span className="handwritten text-3xl text-marker-red animate-pulse italic">Decoding Cosmic Matrix...</span>
             </div>
           ) : result ? (
             <div className="w-full space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-32">
                
                {/* Result Header */}
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b-2 border-marker-black/5 pb-10 gap-8">
                  <div className="text-center md:text-left space-y-2">
                    <span className="handwritten text-sm text-marker-black/40 block uppercase tracking-[0.3em]">Signature Archetype</span>
                    <div className="text-5xl heading-marker text-marker-blue leading-none break-words"><GlossaryTerm word="Day Master">Day Master</GlossaryTerm>: {result.dayMaster}</div>
                  </div>
                  <div className="flex items-center gap-4">
                     <ReadAloudButton text={`${result.densityProfile} ${result.thermodynamicLogic}`} className="!py-2 !px-4 bg-marker-blue/10 border-marker-blue/20" label="Read Profile" />
                     <div className="bg-marker-green/10 px-6 py-3 marker-border border-marker-green/20">
                       <span className="handwritten text-lg md:text-xl text-marker-green font-bold uppercase tracking-widest">Stable</span>
                     </div>
                  </div>
                </div>

                {/* The Pillars Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {result.pillars.map((p: any, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedPillarIndex(i)}
                      className={`group relative bg-white/40 p-4 md:p-6 flex flex-col items-center text-center gap-3 md:gap-4 transition-all marker-border min-h-[160px] justify-center ${
                        selectedPillarIndex === i 
                        ? 'border-marker-blue ring-4 ring-marker-blue/5 scale-105 z-10' 
                        : 'border-marker-black/10 hover:border-marker-blue/40 hover:scale-[1.02]'
                      }`}
                    >
                       <span className="handwritten text-[10px] md:text-xs text-marker-black/30 uppercase tracking-[0.1em]">{p.type}</span>
                       <div className="space-y-1">
                          <div className="text-3xl md:text-4xl heading-marker text-marker-black leading-none group-hover:text-marker-blue transition-colors">{p.stem}</div>
                          <div className="text-xl md:text-2xl heading-marker text-marker-black/20 leading-none">{p.branch}</div>
                       </div>
                       <div className="handwritten text-[10px] md:text-xs text-marker-blue/60 font-bold uppercase leading-tight max-w-full">{p.tenGod}</div>
                       {selectedPillarIndex === i && (
                         <div className="absolute -bottom-1 w-1/2 h-1 bg-marker-blue rounded-full"></div>
                       )}
                    </button>
                  ))}
                </div>

                {/* Expanded Detail Section */}
                {selectedPillarIndex !== null && (
                  <div className="p-8 md:p-16 marker-border border-marker-blue bg-white/70 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 md:p-8">
                        <button 
                          onClick={() => setSelectedPillarIndex(null)} 
                          className="handwritten text-xl text-marker-red font-bold hover:scale-110 transition-transform flex items-center gap-2"
                        >
                          <span className="text-3xl leading-none">×</span> CLOSE
                        </button>
                     </div>

                     <div className="space-y-8 md:space-y-12">
                        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                           <div>
                              <span className="handwritten text-sm text-marker-blue/40 block mb-2 uppercase tracking-[0.4em]">Deep Interpretation</span>
                              <h4 className="heading-marker text-4xl md:text-5xl text-marker-black lowercase">{result.pillars[selectedPillarIndex].type} Pillar</h4>
                           </div>
                           <ReadAloudButton text={result.pillars[selectedPillarIndex].personalExplanation} className="!py-2 !px-4 bg-marker-blue/10 border-marker-blue/20" />
                        </header>

                        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                           <div className="flex flex-col items-center justify-center p-8 md:p-10 marker-border border-marker-blue/10 bg-white/50 min-w-[150px] md:min-w-[200px]">
                              <div className="text-7xl md:text-9xl heading-marker text-marker-black leading-none mb-2">{result.pillars[selectedPillarIndex].stem}</div>
                              <div className="text-5xl md:text-6xl heading-marker text-marker-black/10 leading-none">{result.pillars[selectedPillarIndex].branch}</div>
                              <div className="w-full h-px bg-marker-blue/20 my-6 md:my-8"></div>
                              <div className="handwritten text-xl md:text-2xl text-marker-blue font-bold uppercase tracking-[0.2em]">{result.pillars[selectedPillarIndex].tenGod}</div>
                           </div>
                           <div className="flex-1">
                              <p className="handwritten text-2xl md:text-3xl md:text-4xl italic text-marker-black leading-relaxed">
                                 "{result.pillars[selectedPillarIndex].personalExplanation}"
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* Elemental / Ten Gods Report */}
                <div className="space-y-10 pt-10">
                  <div className="flex items-center gap-6">
                    <span className="handwritten text-lg md:text-xl text-marker-black/30 uppercase tracking-[0.4em] italic shrink-0"><GlossaryTerm word="Ten Gods">Elemental Vectors</GlossaryTerm></span>
                    <div className="h-px bg-marker-black/5 flex-grow"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {result.tenGodsAnalysis.map((god: any, idx: number) => (
                      <div key={idx} className="p-8 md:p-10 marker-border border-marker-black/5 bg-white/30 flex flex-col md:flex-row gap-6 md:gap-10 hover:border-marker-blue/20 transition-all group">
                        <div className="md:w-1/4 space-y-2">
                          <span className="handwritten text-xs text-marker-blue/40 font-bold block uppercase tracking-widest">Potential Node 0{idx+1}</span>
                          <span className="heading-marker text-3xl md:text-4xl text-marker-black leading-none group-hover:text-marker-blue transition-colors break-words">{god.name}</span>
                        </div>
                        <div className="flex-1 space-y-4">
                           <span className="handwritten text-sm text-marker-black/20 italic block tracking-widest">Structural Reference: [{god.vector}]</span>
                           <p className="handwritten text-xl md:text-2xl text-marker-black/60 italic leading-relaxed">"{god.implication}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Synthesis Footer */}
                <div className="pt-16 pb-12">
                  <div className="p-8 md:p-16 text-center marker-border border-marker-green/30 bg-white/20 group relative overflow-hidden">
                     <div className="absolute inset-0 bg-marker-green/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="relative z-10 space-y-6">
                       <div className="handwritten text-lg md:text-xl text-marker-green font-bold uppercase tracking-[0.5em] italic">Stationary Conclusion</div>
                       <p className="heading-marker text-3xl md:text-5xl text-marker-black lowercase leading-tight group-hover:scale-[1.01] transition-transform break-words">
                         {result.densityProfile || "Pattern Harmony Established."}
                       </p>
                       <div className="handwritten text-lg md:text-xl text-marker-black/40 italic max-w-2xl mx-auto pt-4 border-t border-marker-black/5">
                         {result.thermodynamicLogic}
                       </div>
                     </div>
                  </div>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-[0.03] flex flex-col items-center justify-center h-full mt-32 select-none pointer-events-none">
                <div className="text-[12rem] lg:text-[20rem] heading-marker text-marker-black leading-none">SHEN</div>
                <p className="handwritten text-4xl mt-4">awaiting temporal signature...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default BaziTool;
