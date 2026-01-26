
import React, { useState, useMemo } from 'react';
import { getBiologicalDepreciation } from '../services/geminiService';
import { logCalculation } from '../services/dbService';
import { useSyllabusStore } from '../store';
import { GlossaryTerm } from './GlossaryEngine';

// --- Questionnaire Data ---

type QuestionCategory = 'MAINTENANCE' | 'LOAD';

interface QuestionOption {
  label: string;
  value: number; // For Maintenance: Higher is better. For Load: Higher is worse.
}

interface Question {
  id: string;
  category: QuestionCategory;
  text: string;
  subtext: string;
  options: QuestionOption[];
}

const QUESTIONNAIRE: Question[] = [
  // Cellular Maintenance (Telomere) Factors
  {
    id: 'sleep',
    category: 'MAINTENANCE',
    text: 'Circadian Alignment',
    subtext: 'Average Sleep Cycle',
    options: [
      { label: 'Fragmented (< 6h)', value: 2 },
      { label: 'Standard (6-8h)', value: 6 },
      { label: 'Optimal (8h+)', value: 9 },
    ]
  },
  {
    id: 'diet',
    category: 'MAINTENANCE',
    text: 'Metabolic Fuel',
    subtext: 'Nutrition Quality',
    options: [
      { label: 'Synthetic / Fast', value: 2 },
      { label: 'Mixed Source', value: 5 },
      { label: 'Whole / Organic', value: 9 },
    ]
  },
  {
    id: 'movement',
    category: 'MAINTENANCE',
    text: 'Kinetic Output',
    subtext: 'Activity Level',
    options: [
      { label: 'Sedentary', value: 2 },
      { label: 'Moderate Flow', value: 6 },
      { label: 'High Intensity', value: 9 },
    ]
  },
  // Systemic Load Factors
  {
    id: 'stress',
    category: 'LOAD',
    text: 'Psychic Tension',
    subtext: 'Daily Stress Load',
    options: [
      { label: 'Low / Zen', value: 2 },
      { label: 'Manageable', value: 5 },
      { label: 'Chronic / High', value: 9 },
    ]
  },
  {
    id: 'toxins',
    category: 'LOAD',
    text: 'Toxicity',
    subtext: 'Alcohol, Smoke, Pollution',
    options: [
      { label: 'Pristine', value: 1 },
      { label: 'Occasional', value: 5 },
      { label: 'Frequent', value: 9 },
    ]
  },
  {
    id: 'history',
    category: 'LOAD',
    text: 'Biological Legacy',
    subtext: 'Family Health History',
    options: [
      { label: 'Robust', value: 2 },
      { label: 'Standard', value: 5 },
      { label: 'Complex', value: 8 },
    ]
  }
];

const BioCalcTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [age, setAge] = useState<number>(30);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { recordCalculation } = useSyllabusStore();

  const handleOptionSelect = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateScores = () => {
    let maintenanceSum = 0;
    let maintenanceCount = 0;
    let loadSum = 0;
    let loadCount = 0;

    QUESTIONNAIRE.forEach(q => {
      const val = answers[q.id] || 5; 
      if (q.category === 'MAINTENANCE') {
        maintenanceSum += val;
        maintenanceCount++;
      } else {
        loadSum += val;
        loadCount++;
      }
    });

    // Average inputs to get a 1-10 scale
    const telomere = Math.round(maintenanceSum / (maintenanceCount || 1));
    const load = Math.round(loadSum / (loadCount || 1));

    return { telomere, load };
  };

  const isFormComplete = QUESTIONNAIRE.every(q => answers[q.id] !== undefined);

  const handleCalculate = async () => {
    if (!isFormComplete) return;

    setLoading(true);
    setResult(null);

    const { telomere, load } = calculateScores();

    const data = await getBiologicalDepreciation({ 
      age, 
      telomereMaintenance: telomere, 
      systemicLoad: load 
    });
    
    if (data) {
      setResult(data);
      await logCalculation('BIO_ACTUARIAL', `Age:${age}|Telo:${telomere}|Load:${load}`, data);
      recordCalculation();
    }
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
             <h2 className="heading-marker text-6xl text-marker-red lowercase"><GlossaryTerm word="Vitality">Vitality</GlossaryTerm> Gauge</h2>
             <p className="handwritten text-lg text-marker-red opacity-60">Lifespan & Health Projection</p>
           </header>
           
           <div className="space-y-12 pb-20">
             {/* Age Slider */}
             <div className="space-y-4 p-6 marker-border border-marker-black/10 bg-white/40">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Chronological Age</label>
               <input 
                  type="range" min="18" max="100"
                  className="w-full accent-marker-red cursor-pointer"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                />
               <div className="heading-marker text-5xl text-marker-black text-right">{age} years</div>
             </div>

             {/* Dynamic Questionnaire */}
             <div className="space-y-8">
               {QUESTIONNAIRE.map((q) => (
                 <div key={q.id} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <label className="heading-marker text-2xl text-marker-black">{q.text}</label>
                      <span className="handwritten text-xs text-marker-black/40 uppercase tracking-widest text-right">{q.subtext}</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {q.options.map((opt) => (
                       <button
                         key={opt.label}
                         onClick={() => handleOptionSelect(q.id, opt.value)}
                         className={`p-4 text-left marker-border transition-all handwritten text-sm font-bold uppercase tracking-wide
                           ${answers[q.id] === opt.value 
                             ? 'bg-marker-black text-white border-marker-black scale-[1.02] shadow-lg' 
                             : 'bg-white/50 text-marker-black border-marker-black/10 hover:border-marker-black/40'
                           }
                         `}
                       >
                         {opt.label}
                       </button>
                     ))}
                   </div>
                 </div>
               ))}
             </div>

             <button 
                onClick={handleCalculate}
                disabled={loading || !isFormComplete}
                className={`brutalist-button w-full !py-8 !text-2xl mt-6 transition-all ${!isFormComplete ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing Actuarial Data...' : isFormComplete ? 'Calculate Projection' : 'Complete Questionnaire'}
              </button>
           </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[700px] lg:sticky lg:top-12">
           {loading && (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-40">
                <div className="w-20 h-20 border-4 border-marker-red border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-xl text-marker-red animate-pulse italic uppercase tracking-widest">Resolving Probabilities...</span>
             </div>
           )}

           {result ? (
             <div className="w-full space-y-12 animate-in fade-in duration-500 pb-24 lg:pt-20">
                <div className="flex flex-col items-center gap-4 border-b-2 border-marker-black/10 pb-10">
                   <div className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest italic">Actuarial Threshold</div>
                   <div className="text-6xl md:text-8xl heading-marker text-marker-red text-center leading-none">{result.obsolescenceDate}</div>
                   <div className="handwritten text-2xl text-marker-black/60 font-bold uppercase tracking-wide">Age: {result.projectedAge}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 marker-border border-marker-black bg-white/40 flex flex-col items-center justify-center text-center shadow-xl">
                    <span className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest mb-4">Probability Variance</span>
                    <div className="text-6xl font-bold text-marker-black heading-marker">{result.accuracyProbability}%</div>
                    <div className="w-full h-2 bg-marker-black/5 marker-border mt-6 overflow-hidden">
                       <div className="h-full bg-marker-black" style={{width: `${result.accuracyProbability}%`}}></div>
                    </div>
                  </div>
                  <div className="p-8 marker-border border-marker-blue bg-white/40 shadow-xl">
                    <span className="handwritten text-xs text-marker-blue font-bold uppercase tracking-widest block mb-4 italic">Biological Insights</span>
                    <p className="heading-marker text-2xl text-marker-black lowercase leading-tight">{result.depreciationMetrics}</p>
                  </div>
                </div>

                <div className="p-8 marker-border border-marker-black/5 bg-white/20 space-y-6">
                   <div className="handwritten text-xs font-bold uppercase tracking-widest border-b-2 border-marker-black/10 pb-2 text-marker-black/40">Technical Breakdown</div>
                   <p className="handwritten text-xl text-marker-black/80 leading-relaxed italic">
                      "{result.actuarialReport}"
                   </p>
                </div>

                <div className="p-10 text-center marker-border border-marker-red bg-white/40 group cursor-pointer hover:bg-white/60 transition-colors" onClick={() => setResult(null)}>
                   <div className="handwritten text-xs text-marker-red opacity-40 uppercase mb-2 italic tracking-widest">System Status</div>
                   <p className="heading-marker text-3xl text-marker-black lowercase group-hover:scale-102 transition-transform">Reset Scan</p>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none pointer-events-none sticky top-40">
                <div className="text-[10rem] md:text-[14rem] heading-marker text-marker-black leading-none select-none">MORT</div>
                <p className="handwritten text-2xl mt-4">awaiting health data...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default BioCalcTool;
