
import React, { useState } from 'react';
import { getPieDeconstruction } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { logCalculation } from '../services/dbService';
import { useSyllabusStore } from '../store';

const PieDeconstructionTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { recordCalculation } = useSyllabusStore();

  const handleDeconstruction = async () => {
    if (!word.trim()) return;
    setLoading(true);
    setResult(null);
    const data = await getPieDeconstruction(word);
    if (data) {
      setResult(data);
      await logCalculation('PIE_TRACE', word, data);
      recordCalculation();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-4 md:px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        <div className="flex-1 w-full space-y-12">
           <header className="space-y-2">
             <h2 className="heading-marker text-6xl text-marker-blue lowercase"><GlossaryTerm word="Root">Root Analysis</GlossaryTerm></h2>
             <p className="handwritten text-xl text-marker-blue opacity-60">Tracing the <GlossaryTerm word="Semantic">semantic</GlossaryTerm> trace</p>
           </header>
           
           <div className="space-y-10">
             <div className="space-y-4">
               <label className="handwritten text-base text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Enter Subject Word</label>
               <input 
                  type="text" 
                  placeholder="Subject Word..."
                  className="w-full p-8 text-marker-black text-4xl md:text-5xl shadow-sm italic uppercase placeholder:opacity-20"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeconstruction()}
                />
             </div>

             <button 
                onClick={handleDeconstruction}
                disabled={loading}
                className="brutalist-button w-full !py-8 !text-2xl mt-4"
              >
                {loading ? 'Resolving Roots...' : 'Deconstruct Word'}
              </button>
           </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[500px] md:min-h-[700px]">
           {loading && (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-20 md:mt-40">
                <div className="w-20 h-20 border-4 border-marker-blue border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-2xl text-marker-blue animate-pulse italic uppercase tracking-widest">Scanning Ancient Linguistic Archives...</span>
             </div>
           )}

           {result ? (
             <div className="w-full space-y-12 animate-in fade-in duration-500 pb-32">
                <div className="handwritten text-sm text-marker-black opacity-40 uppercase tracking-widest border-b-2 border-marker-black/10 pb-4 italic">
                  Root extraction for: {word.toUpperCase()}
                </div>

                <div className="p-8 md:p-12 marker-border border-marker-black bg-white/40 shadow-xl relative group">
                   <div className="absolute top-4 right-4 handwritten text-sm text-marker-red font-bold uppercase tracking-widest"><GlossaryTerm word="Root">Primary Root</GlossaryTerm></div>
                   <div className="handwritten text-sm text-marker-black/30 uppercase mb-2 italic">Ancient Form</div>
                   <div className="text-7xl md:text-8xl heading-marker text-marker-black leading-none mb-6 group-hover:scale-105 transition-transform">*{result.pieRoot}</div>
                   <div className="p-6 marker-border border-marker-blue border-opacity-10 bg-white/30">
                      <span className="handwritten text-sm text-marker-blue font-bold uppercase tracking-widest block mb-2 italic"><GlossaryTerm word="Origin">Original Intent</GlossaryTerm></span>
                      <p className="handwritten text-2xl md:text-3xl text-marker-black/80 italic">"{result.rootMeaning}"</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="handwritten text-sm text-marker-black opacity-40 uppercase tracking-widest text-center italic"><GlossaryTerm word="Etymology">Semantic Evolution</GlossaryTerm></div>
                   <div className="flex flex-col gap-6 relative">
                      {result.semanticTrace.map((step: string, i: number) => (
                        <div key={i} className="flex gap-4 md:gap-6 items-center group">
                           <div className="marker-border border-marker-red border-opacity-10 w-10 h-10 flex items-center justify-center handwritten text-base text-marker-red font-bold shrink-0">0{i+1}</div>
                           <div className="flex-grow p-6 marker-border border-marker-black/5 bg-white/40 group-hover:border-marker-blue transition-all">
                              <p className="handwritten text-2xl text-marker-black/70 italic leading-snug">{step}</p>
                           </div>
                        </div>
                      ))}
                      <div className="flex gap-4 md:gap-6 items-center">
                        <div className="w-10 h-10 flex items-center justify-center handwritten text-xs text-marker-black/30 font-bold shrink-0 uppercase">END</div>
                        <div className="flex-grow p-8 marker-border border-marker-blue bg-white/40 shadow-2xl relative">
                           <span className="handwritten text-sm text-marker-blue font-bold uppercase tracking-widest block mb-2 italic">Modern Result</span>
                           <p className="heading-marker text-4xl md:text-5xl text-marker-black leading-tight lowercase">{result.modernConcept}</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-10 md:p-12 marker-border border-marker-red bg-white/40 text-marker-black shadow-xl group">
                   <div className="handwritten text-sm font-bold uppercase tracking-widest border-b-2 border-marker-red/10 pb-4 mb-6 italic text-marker-red">Philosophical Implication</div>
                   <p className="handwritten text-3xl md:text-4xl font-medium leading-relaxed italic lowercase group-hover:translate-x-2 transition-transform">
                      "{result.esotericImplication}"
                   </p>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-20 md:mt-40 select-none">
                <div className="text-8xl md:text-[12rem] heading-marker text-marker-black leading-none select-none opacity-40">ROOT</div>
                <p className="handwritten text-3xl mt-8">awaiting word...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PieDeconstructionTool;
