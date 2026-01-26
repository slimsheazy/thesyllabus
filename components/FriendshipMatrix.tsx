
import React, { useState } from 'react';
import { getFriendshipMatrix } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { ReadAloudButton } from './ReadAloudButton';

const FriendshipMatrix: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [subject1, setSubject1] = useState('');
  const [subject2, setSubject2] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!subject1 || !subject2) return;
    setLoading(true);
    const data = await getFriendshipMatrix(subject1, subject2);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 i z-50 bg-white"
      >
        Index
      </button>
      
      <div className="w-full space-y-16">
        <header className="text-center space-y-2">
          <h2 className="heading-marker text-6xl text-marker-blue lowercase">Friendship <GlossaryTerm word="Matrix">Matrix</GlossaryTerm></h2>
          <p className="handwritten text-lg text-marker-blue opacity-60"><GlossaryTerm word="Compatibility">Compatibility</GlossaryTerm> & <GlossaryTerm word="Synastry">Synastry</GlossaryTerm> Report</p>
          <div className="w-full h-px bg-marker-black/10 marker-border mt-8"></div>
        </header>

        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-col md:flex-row gap-8 w-full items-center">
            <div className="flex-1 w-full space-y-2">
              <label className="handwritten text-xs text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Subject Alpha</label>
              <input 
                type="text" 
                placeholder="Name or identifier"
                className="w-full p-8 text-marker-black text-2xl shadow-sm text-center italic bg-white/50 border-2 border-marker-black/5 rounded-xl focus:border-marker-blue focus:outline-none transition-all placeholder:text-marker-black/20"
                value={subject1}
                onChange={(e) => setSubject1(e.target.value)}
              />
            </div>
            <div className="text-marker-black opacity-20 heading-marker text-7xl rotate-90 md:rotate-0">×</div>
            <div className="flex-1 w-full space-y-2">
              <label className="handwritten text-xs text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Subject Beta</label>
              <input 
                type="text" 
                placeholder="Name or identifier"
                className="w-full p-8 text-marker-black text-2xl shadow-sm text-center italic bg-white/50 border-2 border-marker-black/5 rounded-xl focus:border-marker-blue focus:outline-none transition-all placeholder:text-marker-black/20"
                value={subject2}
                onChange={(e) => setSubject2(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={loading} 
            className="brutalist-button w-full max-w-2xl !py-8 !text-2xl"
          >
            {loading ? 'Measuring bond...' : 'Measure Compatibility'}
          </button>
        </div>

        <div className="w-full min-h-[400px] flex flex-col items-center justify-start pb-32">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-8">
               <div className="w-20 h-20 border-4 border-marker-blue border-t-transparent animate-spin rounded-full"></div>
               <span className="handwritten text-xl text-marker-blue animate-pulse italic">Analyzing <GlossaryTerm word="Connection">Connection</GlossaryTerm>...</span>
            </div>
          )}

          {result && !loading && (
            <div className="w-full max-w-5xl mx-auto space-y-16 animate-in fade-in duration-500">
               <div className="flex flex-col items-center gap-6">
                  <div className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-[0.5em] italic">Compatibility Rating</div>
                  <div className="text-marker-black font-bold text-[10rem] leading-none heading-marker select-none">{result.compatibilityScore}%</div>
                  <div className="w-full h-2 bg-marker-black/5 marker-border max-w-md overflow-hidden">
                     <div className="h-full bg-marker-blue" style={{width: `${result.compatibilityScore}%`}}></div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 marker-border border-marker-blue bg-white/40 shadow-xl relative">
                     <div className="flex justify-between items-center mb-4 border-b-2 border-marker-blue/10 pb-2">
                        <span className="handwritten text-xs text-marker-blue font-bold uppercase tracking-widest italic"><GlossaryTerm word="Frequency">Frequency</GlossaryTerm> Match</span>
                        <ReadAloudButton text={`${result.vibrationalMatch}. ${result.analysis}`} className="!py-1 !px-2 !text-xs bg-marker-blue/5 border-marker-blue/20 text-marker-blue" />
                     </div>
                     <p className="handwritten text-2xl italic text-marker-black/80 leading-relaxed">"{result.vibrationalMatch}"</p>
                  </div>
                  <div className="p-6 marker-border border-marker-black bg-white/40 shadow-xl">
                     <span className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest block mb-4 italic">Final <GlossaryTerm word="Analysis">Analysis</GlossaryTerm></span>
                     <p className="heading-marker text-3xl text-marker-black lowercase">{result.analysis}</p>
                  </div>
               </div>
            </div>
          )}
          
          {!result && !loading && (
            <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-24 select-none">
              <div className="text-[10rem] heading-marker text-marker-black leading-none">NONE</div>
              <p className="handwritten text-2xl mt-4">awaiting subjects...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendshipMatrix;
