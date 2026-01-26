
import React, { useState } from 'react';
import { generateCosmicMadLib } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';

const CosmicMadLibs: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputs, setInputs] = useState({ noun: '', verb: '', adjective: '', object: '', place: '' });
  const [ritual, setRitual] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const result = await generateCosmicMadLib(inputs);
    setRitual(result);
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
            <h2 className="heading-marker text-6xl text-marker-red lowercase"><GlossaryTerm word="Ritual">Ritual</GlossaryTerm> Workshop</h2>
            <p className="handwritten text-lg text-marker-red opacity-60">Custom <GlossaryTerm word="Invocation">Workshop</GlossaryTerm> Generation</p>
          </header>

          <div className="space-y-6">
            {Object.keys(inputs).map(key => (
              <div key={key} className="space-y-1">
                <label className="handwritten text-xs text-marker-black opacity-40 block ml-2 uppercase tracking-widest">{key}</label>
                <input 
                  type="text" 
                  placeholder={`[${key.toUpperCase()}]`}
                  className="w-full p-5 text-marker-black text-xl shadow-sm italic"
                  value={(inputs as any)[key]}
                  onChange={(e) => setInputs({...inputs, [key]: e.target.value})}
                />
              </div>
            ))}
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="brutalist-button w-full !py-6 mt-6"
            >
              {loading ? 'Creating Ritual...' : 'Generate Workshop'}
            </button>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[600px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-40">
                <div className="w-16 h-16 border-4 border-marker-red border-t-transparent animate-spin rounded-full"></div>
                <p className="handwritten text-xl text-marker-red animate-pulse uppercase italic">Assembling Ritual <GlossaryTerm word="Process">Steps</GlossaryTerm>...</p>
             </div>
           ) : ritual ? (
             <div className="w-full space-y-12 pb-24 animate-in fade-in duration-500">
               <h3 className="heading-marker text-6xl text-marker-black text-center lowercase">{ritual.title}</h3>
               <div className="space-y-6">
                 {ritual.steps.map((s: string, i: number) => (
                   <div key={i} className="p-8 marker-border border-marker-red bg-white/40 shadow-sm relative group">
                     <span className="handwritten text-xs text-marker-red opacity-40 block mb-2 uppercase tracking-widest">Step 0{i+1}</span>
                     <p className="handwritten text-2xl italic text-marker-black/80 leading-relaxed">"{s}"</p>
                   </div>
                 ))}
               </div>
               <div className="p-10 marker-border border-marker-black bg-white/40 shadow-2xl">
                 <div className="handwritten text-xs font-bold uppercase tracking-widest border-b-2 border-marker-black/10 pb-2 mb-4">Final <GlossaryTerm word="Revelation">Revelation</GlossaryTerm></div>
                 <p className="heading-marker text-4xl text-marker-black leading-tight lowercase">"{ritual.revelation}"</p>
               </div>
             </div>
           ) : (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none">
                <div className="text-[10rem] heading-marker text-marker-black">EMPTY</div>
                <p className="handwritten text-2xl mt-4">awaiting <GlossaryTerm word="Creation">ritual parameters</GlossaryTerm>...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CosmicMadLibs;
