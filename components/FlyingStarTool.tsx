
import React, { useState } from 'react';
import { getFlyingStarAnalysis } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { logCalculation } from '../services/dbService';
import { useSyllabusStore } from '../store';

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const FlyingStarTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [period, setPeriod] = useState<number>(9);
  const [degree, setDegree] = useState<number>(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { recordCalculation } = useSyllabusStore();

  const handleAnalysis = async () => {
    setLoading(true);
    setResult(null);
    const data = await getFlyingStarAnalysis(period, degree);
    if (data) {
      setResult(data);
      await logCalculation('XUAN_KONG', `Period:${period}|Degree:${degree}`, data);
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
             <h2 className="heading-marker text-6xl text-marker-teal lowercase"><GlossaryTerm word="Flying Star">Flying Star</GlossaryTerm></h2>
             <p className="handwritten text-xl text-marker-teal opacity-60">Spatial <GlossaryTerm word="Feng Shui">Feng Shui</GlossaryTerm></p>
           </header>
           
           <div className="space-y-12">
             <div className="space-y-4">
               <label className="handwritten text-base text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Construction Period</label>
               <div className="flex flex-wrap gap-3">
                 {PERIODS.map(p => (
                   <button 
                    key={p} 
                    onClick={() => setPeriod(p)}
                    className={`px-6 py-2 marker-border handwritten text-base font-bold tracking-widest transition-all ${
                      period === p ? 'bg-marker-teal/10 border-marker-teal text-marker-teal' : 'border-marker-black/10 text-marker-black opacity-40 hover:opacity-100'
                    }`}
                   >
                     P{p}
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-6">
               <label className="handwritten text-base text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Facing Direction [0-359°]</label>
               <input 
                  type="range" min="0" max="359"
                  className="w-full accent-marker-teal cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
                  value={degree}
                  onChange={(e) => setDegree(parseInt(e.target.value))}
                />
               <div className="flex justify-between items-end">
                 <div className="heading-marker text-6xl md:text-7xl text-marker-black">{degree}°</div>
                 <div className="handwritten text-xl text-marker-black/30 italic uppercase">Alignment</div>
               </div>
             </div>

             <button 
                onClick={handleAnalysis}
                disabled={loading}
                className="brutalist-button w-full !py-8 !text-2xl mt-6"
              >
                {loading ? 'Mapping Grid...' : 'Map Space'}
              </button>
           </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[500px] md:min-h-[700px]">
           {loading && (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-20 md:mt-40">
                <div className="w-20 h-20 border-4 border-marker-teal border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-2xl text-marker-teal animate-pulse italic uppercase tracking-widest">Computing Stars...</span>
             </div>
           )}

           {result ? (
             <div className="w-full space-y-12 animate-in fade-in duration-500 pb-24">
                <div className="handwritten text-sm text-marker-black opacity-40 uppercase tracking-widest border-b-2 border-marker-black/10 pb-4 italic">
                  Spatial Grid // Period {period} // Facing {degree}°
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4">
                   {result.palaces.map((p: any, i: number) => (
                     <div key={i} className="marker-border border-marker-black bg-white/40 p-2 md:p-4 aspect-square flex flex-col justify-between items-center text-center group hover:border-marker-blue transition-all">
                        <span className="handwritten text-xs md:text-sm text-marker-black/30 uppercase tracking-widest italic">{p.direction}</span>
                        <div className="relative flex items-center justify-center w-full h-full">
                           <div className="text-4xl md:text-6xl heading-marker text-marker-black leading-none group-hover:scale-110 transition-transform">{p.baseStar}</div>
                           <div className="absolute -top-1 -right-1 heading-marker text-marker-red text-sm md:text-base">{p.mountainStar}</div>
                           <div className="absolute -bottom-1 -left-1 heading-marker text-marker-blue text-sm md:text-base">{p.waterStar}</div>
                        </div>
                        <span className="handwritten text-[10px] md:text-xs text-marker-black/60 uppercase leading-none truncate w-full italic">{p.technicalStatus}</span>
                     </div>
                   ))}
                </div>

                <div className="p-6 md:p-10 marker-border border-marker-blue bg-white/40 shadow-xl">
                   <div className="handwritten text-sm font-bold uppercase tracking-widest border-b-2 border-marker-blue/10 pb-4 mb-6 italic">Recommended Remedies</div>
                   <ul className="space-y-4">
                      {result.spatialAdjustments.map((adj: string, i: number) => (
                        <li key={i} className="heading-marker text-2xl md:text-3xl text-marker-black flex gap-4 items-start group">
                           <span className="marker-border border-marker-red border-opacity-20 text-marker-red px-2 py-px handwritten text-sm mt-2 shrink-0 group-hover:bg-marker-red group-hover:text-white transition-all uppercase">REMEDY {i+1}</span>
                           <span className="lowercase leading-tight">{adj}</span>
                        </li>
                      ))}
                   </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 marker-border border-marker-black/5 bg-white/40 space-y-4">
                     <div className="handwritten text-sm text-marker-black opacity-40 uppercase tracking-widest italic">Overview</div>
                     <p className="handwritten text-2xl text-marker-black/80 italic leading-relaxed">"{result.energyFlowSummary}"</p>
                  </div>
                  <div className="p-8 marker-border border-marker-black/5 bg-white/40 space-y-4">
                     <div className="handwritten text-sm text-marker-black opacity-40 uppercase tracking-widest italic">Spatial Logic</div>
                     <p className="handwritten text-xl text-marker-black/70 italic leading-relaxed">{result.thermodynamicLogic}</p>
                  </div>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-20 md:mt-40 select-none">
                <div className="grid grid-cols-3 gap-2 w-64 h-64 md:w-80 md:h-80 marker-border border-marker-black/20 p-2">
                   {[...Array(9)].map((_, i) => <div key={i} className="marker-border border-marker-black/5"></div>)}
                </div>
                <p className="handwritten text-3xl mt-8">awaiting spatial parameters...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default FlyingStarTool;
