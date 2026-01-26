
import React, { useState } from 'react';
import { calculateLostItem, CalculationResult } from '../services/lostItemService';
import { GlossaryTerm } from './GlossaryEngine';
import { useSyllabusStore } from '../store';
import { logCalculation } from '../services/dbService';

const ITEM_TYPES = [
  "Keys", "Wallet/Purse", "Phone", "Jewelry", "Document", "Clothing", "Sentimental", "Other"
];

const LostItemFinder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // State
  const [step, setStep] = useState<'input' | 'calculating' | 'result'>('input');
  const [inputs, setInputs] = useState({
    itemName: '',
    dateLost: new Date().toISOString().split('T')[0],
    seekerName: '',
    itemType: 'Other',
    lastSeen: '',
    system: 'pythagorean' as 'pythagorean' | 'chaldean'
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const { recordCalculation } = useSyllabusStore();

  // Handlers
  const handleCalculate = async () => {
    if (!inputs.itemName) return;
    
    setStep('calculating');
    
    // Simulate mystical calculation delay
    await new Promise(r => setTimeout(r, 1500));

    const calc = calculateLostItem(inputs.itemName, inputs.dateLost, inputs.seekerName, inputs.system);
    setResult(calc);
    
    await logCalculation('LOST_ITEM', `${inputs.itemName} (${inputs.dateLost})`, calc);
    recordCalculation();
    setStep('result');
  };

  const reset = () => {
    setResult(null);
    setStep('input');
    setInputs(prev => ({ ...prev, itemName: '', lastSeen: '' }));
  };

  // Render Helpers
  const renderCompass = (angle: number, directionLabel: string) => {
    // If angle is -1 (Center), we render a target
    const isCenter = angle === -1;

    return (
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        {/* Outer Ring */}
        <svg viewBox="0 0 100 100" className="w-full h-full absolute animate-[spin_60s_linear_infinite]">
          <circle cx="50" cy="50" r="48" fill="none" stroke="var(--marker-black)" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.3" />
          <text x="50" y="8" textAnchor="middle" fontSize="6" fill="var(--marker-black)" opacity="0.5">N</text>
          <text x="92" y="52" textAnchor="middle" fontSize="6" fill="var(--marker-black)" opacity="0.5">E</text>
          <text x="50" y="96" textAnchor="middle" fontSize="6" fill="var(--marker-black)" opacity="0.5">S</text>
          <text x="8" y="52" textAnchor="middle" fontSize="6" fill="var(--marker-black)" opacity="0.5">W</text>
        </svg>

        {/* The Needle or Target */}
        {isCenter ? (
           <div className="relative z-10 animate-pulse">
             <div className="text-6xl">🎯</div>
           </div>
        ) : (
           <div 
             className="relative z-10 transition-transform duration-1000 ease-out"
             style={{ transform: `rotate(${angle}deg)` }}
           >
             {/* Needle Graphic */}
             <svg width="20" height="140" viewBox="0 0 20 140">
               <path d="M10 0 L20 70 L10 140 L0 70 Z" fill="var(--marker-blue)" />
               <circle cx="10" cy="70" r="3" fill="white" />
             </svg>
           </div>
        )}
        
        {/* Label */}
        <div className="absolute -bottom-16 text-center">
           <div className="heading-marker text-3xl text-marker-blue">{directionLabel}</div>
           <div className="handwritten text-sm opacity-60 uppercase tracking-widest">Calculated Vector</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 px-6 md:px-12 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      {/* Header */}
      <header className="w-full text-center space-y-4 mb-12">
        <h2 className="heading-marker text-6xl text-marker-purple lowercase"><GlossaryTerm word="Numerology">Numerology</GlossaryTerm> Locator</h2>
        <p className="handwritten text-xl text-marker-purple opacity-60">Lost Item Recovery Engine</p>
        <div className="w-full h-px bg-marker-black/10 marker-border mt-8"></div>
      </header>

      {/* VIEW: INPUT */}
      {step === 'input' && (
        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">What was lost?</label>
               <input 
                 type="text" 
                 placeholder="e.g. Silver Ring"
                 className="w-full p-4 text-xl marker-border bg-white/50 focus:border-marker-purple outline-none placeholder:opacity-30"
                 value={inputs.itemName}
                 onChange={e => setInputs({...inputs, itemName: e.target.value})}
               />
             </div>
             <div className="space-y-2">
               <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">Type of Item</label>
               <select 
                 className="w-full p-4 text-xl marker-border bg-white/50 focus:border-marker-purple outline-none"
                 value={inputs.itemType}
                 onChange={e => setInputs({...inputs, itemType: e.target.value})}
               >
                 {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">Date Lost</label>
               <input 
                 type="date" 
                 className="w-full p-4 text-xl marker-border bg-white/50 focus:border-marker-purple outline-none"
                 value={inputs.dateLost}
                 onChange={e => setInputs({...inputs, dateLost: e.target.value})}
               />
             </div>
             <div className="space-y-2">
               <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">Seeker Name (Optional)</label>
               <input 
                 type="text" 
                 placeholder="Your Name"
                 className="w-full p-4 text-xl marker-border bg-white/50 focus:border-marker-purple outline-none placeholder:opacity-30"
                 value={inputs.seekerName}
                 onChange={e => setInputs({...inputs, seekerName: e.target.value})}
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest ml-1">Last Seen (Optional Context)</label>
            <input 
              type="text" 
              placeholder="e.g. On the kitchen counter..."
              className="w-full p-4 text-xl marker-border bg-white/50 focus:border-marker-purple outline-none placeholder:opacity-30"
              value={inputs.lastSeen}
              onChange={e => setInputs({...inputs, lastSeen: e.target.value})}
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
             <div className="flex gap-4">
                <button 
                  onClick={() => setInputs({...inputs, system: 'pythagorean'})}
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${inputs.system === 'pythagorean' ? 'bg-marker-black text-white border-marker-black' : 'text-marker-black/40 border-marker-black/10'}`}
                >Pythagorean</button>
                <button 
                  onClick={() => setInputs({...inputs, system: 'chaldean'})}
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${inputs.system === 'chaldean' ? 'bg-marker-black text-white border-marker-black' : 'text-marker-black/40 border-marker-black/10'}`}
                >Chaldean</button>
             </div>
             <button 
               onClick={handleCalculate}
               disabled={!inputs.itemName}
               className="brutalist-button !py-4 !px-8 !text-xl shadow-lg border-marker-purple disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Triangulate Location
             </button>
          </div>
        </div>
      )}

      {/* VIEW: CALCULATING */}
      {step === 'calculating' && (
        <div className="flex flex-col items-center justify-center py-32 gap-8 animate-in fade-in duration-700">
           <div className="w-24 h-24 border-8 border-marker-purple border-t-transparent animate-spin rounded-full"></div>
           <div className="text-center space-y-2">
              <span className="handwritten text-2xl text-marker-purple font-black animate-pulse uppercase tracking-widest">Calculating Trajectory...</span>
              <p className="handwritten text-sm opacity-60">Analyzing {inputs.system} vibrational frequencies</p>
           </div>
        </div>
      )}

      {/* VIEW: RESULT */}
      {step === 'result' && result && (
        <div className="w-full flex flex-col lg:flex-row gap-12 lg:gap-16 items-start animate-in fade-in duration-500 pb-20">
           
           {/* Left: Compass & Synthesis */}
           <div className="w-full lg:w-1/3 flex flex-col items-center gap-10">
              <div className="p-8 marker-border border-marker-purple bg-white shadow-xl flex flex-col items-center">
                 <span className="handwritten text-xs font-bold uppercase text-marker-purple tracking-widest mb-6">Energy Vector</span>
                 {renderCompass(result.interpretation.angle, result.interpretation.direction)}
              </div>

              <div className="p-6 marker-border border-marker-black/10 bg-white/40 w-full space-y-4">
                 <div className="flex justify-between items-center border-b border-marker-black/10 pb-2">
                    <span className="handwritten text-xs font-bold uppercase opacity-40">Calculation Breakdown</span>
                    <span className="heading-marker text-xl text-marker-purple">Master # {result.masterNumber}</span>
                 </div>
                 <div className="space-y-2 font-mono text-sm opacity-70">
                    <div className="flex justify-between"><span>Item ({inputs.itemName}):</span> <span>{result.breakdown.itemSum}</span></div>
                    <div className="flex justify-between"><span>Time ({inputs.dateLost}):</span> <span>+{result.breakdown.dateSum}</span></div>
                    {inputs.seekerName && <div className="flex justify-between"><span>Seeker ({inputs.seekerName}):</span> <span>+{result.breakdown.seekerSum}</span></div>}
                    <div className="flex justify-between border-t border-dashed border-marker-black/30 pt-1 font-bold"><span>Total:</span> <span>{result.breakdown.totalSum} → {result.masterNumber}</span></div>
                 </div>
              </div>

              <button onClick={reset} className="text-sm font-bold uppercase tracking-widest text-marker-black/40 hover:text-marker-black underline decoration-2 underline-offset-4">
                 Try Different Calculation
              </button>
           </div>

           {/* Right: Checklist & Interpretation */}
           <div className="flex-1 w-full space-y-8">
              
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                   <span className="text-4xl">{result.interpretation.icon}</span>
                   <h3 className="heading-marker text-5xl text-marker-black lowercase">Core Guidance</h3>
                 </div>
                 <div className="p-8 marker-border border-marker-purple/50 bg-marker-purple/5">
                    <p className="handwritten text-2xl text-marker-black italic leading-relaxed font-medium">
                      "{result.interpretation.clues}"
                    </p>
                 </div>
              </div>

              {/* Grid of Clues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 marker-border border-marker-black/10 bg-white/60">
                    <span className="handwritten text-xs font-bold uppercase text-marker-blue tracking-widest block mb-3">Room Type</span>
                    <p className="heading-marker text-2xl text-marker-black leading-tight">{result.interpretation.roomType}</p>
                 </div>
                 <div className="p-6 marker-border border-marker-black/10 bg-white/60">
                    <span className="handwritten text-xs font-bold uppercase text-marker-red tracking-widest block mb-3">Search Height</span>
                    <p className="heading-marker text-2xl text-marker-black leading-tight">{result.interpretation.height}</p>
                 </div>
                 <div className="p-6 marker-border border-marker-black/10 bg-white/60">
                    <span className="handwritten text-xs font-bold uppercase text-marker-green tracking-widest block mb-3">Materials Nearby</span>
                    <p className="heading-marker text-2xl text-marker-black leading-tight">{result.interpretation.materials}</p>
                 </div>
                 <div className="p-6 marker-border border-marker-black/10 bg-white/60">
                    <span className="handwritten text-xs font-bold uppercase text-marker-teal tracking-widest block mb-3">Look Inside</span>
                    <p className="heading-marker text-2xl text-marker-black leading-tight">{result.interpretation.containers}</p>
                 </div>
              </div>

              {/* Checklist */}
              <div className="p-8 marker-border border-marker-black bg-white shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <span className="handwritten text-sm font-black uppercase tracking-widest">Search Checklist</span>
                    <span className="handwritten text-xs font-bold bg-marker-black text-white px-2 py-1 rounded">{result.interpretation.timing}</span>
                 </div>
                 
                 <div className="space-y-4">
                    {result.interpretation.specificSpots.map((spot, i) => (
                      <label key={i} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-marker-black/5 rounded transition-colors">
                         <div className="relative flex items-center">
                            <input type="checkbox" className="peer w-6 h-6 appearance-none border-2 border-marker-black rounded checked:bg-marker-black checked:border-marker-black transition-all" />
                            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         </div>
                         <span className="handwritten text-xl text-marker-black group-hover:translate-x-1 transition-transform">{spot}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-marker-black/5 rounded transition-colors border-t border-marker-black/10 mt-4 pt-4">
                         <div className="relative flex items-center">
                            <input type="checkbox" className="peer w-6 h-6 appearance-none border-2 border-marker-green rounded checked:bg-marker-green checked:border-marker-green transition-all" />
                            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         </div>
                         <span className="heading-marker text-2xl text-marker-green">Item Found!</span>
                    </label>
                 </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default LostItemFinder;
