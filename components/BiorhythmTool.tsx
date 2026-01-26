
import React, { useState, useEffect, useMemo } from 'react';
import { getBiorhythmInterpretation } from '../services/geminiService';
import { useSyllabusStore } from '../store';
import { ReadAloudButton } from './ReadAloudButton';
import { GlossaryTerm } from './GlossaryEngine';

// Constants for sine wave calculations
const CYCLES = {
  PHYSICAL: 23,
  EMOTIONAL: 28,
  INTELLECTUAL: 33
};

const BiorhythmTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [birthDate, setBirthDate] = useState('');
  const [analysis, setAnalysis] = useState<{ brief: string; suggestion: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { recordCalculation } = useSyllabusStore();

  const today = useMemo(() => new Date(), []);
  
  // Calculate raw sine value (-1 to 1) for a specific date
  const calculateValue = (bDate: Date, targetDate: Date, cycleDays: number) => {
    const diffTime = targetDate.getTime() - bDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.sin((2 * Math.PI * diffDays) / cycleDays);
  };

  // Generate chart data: +/- 14 days from today
  const chartData = useMemo(() => {
    if (!birthDate) return null;
    const bDate = new Date(birthDate);
    const days = [];
    
    for (let i = -14; i <= 14; i++) {
      const target = new Date(today);
      target.setDate(today.getDate() + i);
      days.push({
        date: target,
        offset: i,
        physical: calculateValue(bDate, target, CYCLES.PHYSICAL),
        emotional: calculateValue(bDate, target, CYCLES.EMOTIONAL),
        intellectual: calculateValue(bDate, target, CYCLES.INTELLECTUAL),
      });
    }
    return days;
  }, [birthDate, today]);

  // Current values for today (offset 0)
  const todayMetrics = useMemo(() => {
    if (!chartData) return null;
    const current = chartData.find(d => d.offset === 0);
    if (!current) return null;
    return {
      physical: Math.round(current.physical * 100),
      emotional: Math.round(current.emotional * 100),
      intellectual: Math.round(current.intellectual * 100)
    };
  }, [chartData]);

  const handleAnalyze = async () => {
    if (!todayMetrics) return;
    setLoading(true);
    setAnalysis(null);
    const result = await getBiorhythmInterpretation(todayMetrics);
    setAnalysis(result);
    recordCalculation();
    setLoading(false);
  };

  // Helper to generate SVG path 'd' attribute
  const getPathD = (data: typeof chartData, key: 'physical' | 'emotional' | 'intellectual', width: number, height: number) => {
    if (!data) return '';
    const stepX = width / (data.length - 1);
    const zeroY = height / 2;
    const scaleY = (height / 2) * 0.8; // 80% amplitude

    return data.map((point, i) => {
      const x = i * stepX;
      const y = zeroY - (point[key] * scaleY);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Find critical days (crossing zero)
  const criticalDays = useMemo(() => {
    if (!chartData) return [];
    return chartData.filter(d => 
      Math.abs(d.physical) < 0.15 || 
      Math.abs(d.emotional) < 0.15 || 
      Math.abs(d.intellectual) < 0.15
    ).filter(d => d.offset >= 0 && d.offset <= 3); // Only show upcoming criticals
  }, [chartData]);

  // Check if Intellectual Capacity is high for "Syllabus" work
  const isIntellectualPeak = todayMetrics && todayMetrics.intellectual > 60;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col xl:flex-row gap-16 items-start">
        {/* Left: Input & Metrics */}
        <div className="w-full xl:w-[400px] space-y-12">
           <header className="space-y-4">
             <h2 className="heading-marker text-6xl text-marker-teal lowercase"><GlossaryTerm word="Biorhythm">Bio-Metrics</GlossaryTerm></h2>
             <p className="handwritten text-lg text-marker-teal opacity-60"><GlossaryTerm word="Cycles">Cycle</GlossaryTerm> <GlossaryTerm word="Capacity">Capacity</GlossaryTerm> Plotter</p>
           </header>
           
           <div className="space-y-8">
             <div className="space-y-2">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Origin Date</label>
               <input 
                  type="date" 
                  className="w-full p-6 text-marker-black text-2xl shadow-sm italic bg-white/50 border-2 border-transparent focus:border-marker-teal/20 outline-none transition-all rounded-xl"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
             </div>

             {todayMetrics && (
               <div className="space-y-4 p-6 marker-border border-marker-black/10 bg-white/40">
                  <div className="flex justify-between items-center">
                    <span className="handwritten text-sm font-bold text-marker-red uppercase tracking-widest"><GlossaryTerm word="Physical">Physical</GlossaryTerm> (23d)</span>
                    <span className="heading-marker text-3xl text-marker-black">{todayMetrics.physical}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="handwritten text-sm font-bold text-marker-blue uppercase tracking-widest"><GlossaryTerm word="Emotional">Emotional</GlossaryTerm> (28d)</span>
                    <span className="heading-marker text-3xl text-marker-black">{todayMetrics.emotional}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="handwritten text-sm font-bold text-marker-teal uppercase tracking-widest"><GlossaryTerm word="Intellectual">Intellectual</GlossaryTerm> (33d)</span>
                    <span className="heading-marker text-3xl text-marker-black">{todayMetrics.intellectual}%</span>
                  </div>
               </div>
             )}

             {isIntellectualPeak && (
                <div className="p-4 bg-marker-teal/10 border-l-4 border-marker-teal animate-pulse">
                   <span className="handwritten text-sm font-bold text-marker-teal uppercase tracking-widest"><GlossaryTerm word="Peak">Capacity Peak</GlossaryTerm></span>
                   <p className="handwritten text-base italic text-marker-black/70">
                     Intellectual channels are open. Optimal time for complex syllabus modules.
                   </p>
                </div>
             )}

             <button 
                onClick={handleAnalyze}
                disabled={loading || !birthDate}
                className="brutalist-button w-full !py-6 !text-2xl shadow-xl mt-4"
              >
                {loading ? 'Interpreting Cycles...' : 'Analyze Capacity'}
              </button>
           </div>
        </div>

        {/* Right: Visualization & Analysis */}
        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[600px] gap-12">
           
           {/* Chart Container */}
           <div className="w-full h-[350px] bg-white/40 marker-border border-marker-black/20 relative shadow-inner overflow-hidden flex items-center justify-center p-4">
              {chartData ? (
                 <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    <line x1="0" y1="150" x2="800" y2="150" stroke="var(--marker-black)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                    <line x1="400" y1="0" x2="400" y2="300" stroke="var(--marker-black)" strokeWidth="2" opacity="0.5" />
                    <text x="405" y="290" className="handwritten text-xs fill-marker-black opacity-50 uppercase font-bold">Today</text>

                    {/* Paths */}
                    <path d={getPathD(chartData, 'physical', 800, 300)} fill="none" stroke="var(--marker-red)" strokeWidth="3" opacity="0.8" />
                    <path d={getPathD(chartData, 'emotional', 800, 300)} fill="none" stroke="var(--marker-blue)" strokeWidth="3" opacity="0.8" />
                    <path d={getPathD(chartData, 'intellectual', 800, 300)} fill="none" stroke="var(--marker-teal)" strokeWidth="4" />

                    {/* Critical Points (Zero Crossings) */}
                    {chartData.map((d, i) => {
                       const x = i * (800 / (chartData.length - 1));
                       return (
                         <g key={i}>
                           {Math.abs(d.physical) < 0.1 && <circle cx={x} cy={150} r="4" fill="var(--marker-red)" />}
                           {Math.abs(d.emotional) < 0.1 && <circle cx={x} cy={150} r="4" fill="var(--marker-blue)" />}
                           {Math.abs(d.intellectual) < 0.1 && <circle cx={x} cy={150} r="5" fill="var(--marker-teal)" stroke="white" strokeWidth="2" />}
                         </g>
                       );
                    })}
                 </svg>
              ) : (
                <div className="text-center opacity-10 select-none">
                   <div className="text-9xl heading-marker text-marker-black">WAVE</div>
                   <p className="handwritten text-2xl uppercase tracking-widest mt-2">Awaiting <GlossaryTerm word="Sine Wave">temporal data</GlossaryTerm></p>
                </div>
              )}
           </div>

           {/* Analysis Output */}
           {analysis && (
             <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                <div className="p-8 marker-border border-marker-teal bg-white/60 shadow-xl relative">
                   <div className="flex justify-between items-center mb-4 border-b-2 border-marker-teal/10 pb-2">
                     <span className="handwritten text-sm font-black uppercase text-marker-teal tracking-widest">Daily Capacity Brief</span>
                     <ReadAloudButton text={`${analysis.brief}. ${analysis.suggestion}`} className="!py-1 !px-3 !text-xs bg-marker-teal/10 border-marker-teal/20 text-marker-teal" />
                   </div>
                   <p className="handwritten text-2xl md:text-3xl italic text-marker-black font-medium leading-relaxed">
                     "{analysis.brief}"
                   </p>
                </div>

                <div className="p-8 marker-border border-marker-black/10 bg-white/40">
                   <span className="handwritten text-xs font-bold uppercase text-marker-black/40 tracking-widest block mb-4">Syllabus Recommendation</span>
                   <p className="heading-marker text-4xl text-marker-black lowercase leading-tight">
                     {analysis.suggestion}
                   </p>
                </div>
             </div>
           )}

           {criticalDays.length > 0 && birthDate && (
             <div className="w-full p-6 border-l-4 border-marker-red bg-marker-red/5">
                <span className="handwritten text-xs font-bold uppercase text-marker-red tracking-widest block mb-2">Critical Warning</span>
                <p className="handwritten text-lg text-marker-black/80">
                  Zero-point crossing detected in the next 3 days. Stability may be volatile. Proceed with intention.
                </p>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default BiorhythmTool;
