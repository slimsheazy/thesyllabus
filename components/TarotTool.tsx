
import React, { useState, useEffect } from 'react';
import { getTarotReading } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { logCalculation } from '../services/dbService';
import { useSyllabusStore } from '../store';
import { ReadAloudButton } from './ReadAloudButton';
import { FULL_DECK } from '../services/tarotData';

const TarotTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [question, setQuestion] = useState('');
  const [reading, setReading] = useState<{ interpretation: string; guidance: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<{name: string, isReversed: boolean}[]>([]);
  const { recordCalculation } = useSyllabusStore();

  const handleDraw = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setReading(null);
    setDrawnCards([]);
    setIsShuffling(true);
    
    // Simulate shuffling duration
    await new Promise(r => setTimeout(r, 2000));
    setIsShuffling(false);
    
    const shuffled = [...FULL_DECK].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(name => ({
      name,
      isReversed: Math.random() > 0.7
    }));
    
    setDrawnCards(selected);
    const result = await getTarotReading(selected, question);
    setReading(result);
    setLoading(false);
    
    await logCalculation('TAROT', question, result);
    recordCalculation();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-6 md:px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col lg:flex-row gap-12 items-start">
        <div className="flex-1 w-full space-y-10">
           <header className="space-y-2">
             <h2 className="heading-marker text-6xl text-marker-purple lowercase"><GlossaryTerm word="Tarot">Tarot</GlossaryTerm> Synth</h2>
             <p className="handwritten text-lg text-marker-blue opacity-60"><GlossaryTerm word="Archetype">Archetypal</GlossaryTerm> <GlossaryTerm word="Interpretation">Interpretation</GlossaryTerm></p>
           </header>
           
           <div className="space-y-6">
             <textarea 
               value={question}
               onChange={(e) => setQuestion(e.target.value)}
               placeholder="What do you wish to ask the cards?"
               className="w-full p-8 text-marker-black text-2xl min-h-[300px] shadow-sm italic focus:outline-none focus:border-b-2 focus:border-marker-purple bg-transparent border-b border-marker-black/10"
             />
           </div>

           <button 
             disabled={loading || isShuffling}
             onClick={handleDraw}
             className="brutalist-button w-full !py-6 !text-2xl"
           >
             {isShuffling ? 'Shuffling Deck...' : loading ? 'Interpreting...' : 'Execute Spread'}
           </button>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[600px] relative perspective-[1000px]">
           {/* Shuffling Animation */}
           {isShuffling && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-72">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute inset-0 bg-marker-purple border-2 border-white rounded-lg shadow-xl"
                      style={{
                        animation: `shuffleCard 0.5s infinite ease-in-out alternate`,
                        animationDelay: `${i * 0.1}s`,
                        transform: `translateZ(${i * 2}px)`
                      }}
                    />
                  ))}
                  <style>{`
                    @keyframes shuffleCard {
                      0% { transform: translateX(0) rotate(0deg); }
                      50% { transform: translateX(20px) rotate(5deg); }
                      100% { transform: translateX(-20px) rotate(-5deg); }
                    }
                  `}</style>
                </div>
             </div>
           )}

           {loading && !isShuffling && (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-40">
                <div className="w-20 h-20 border-4 border-marker-purple border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-xl text-marker-purple animate-pulse">Reading the <GlossaryTerm word="Archetype">Archetypes</GlossaryTerm>...</span>
             </div>
           )}

           {reading && !isShuffling && (
             <div className="w-full space-y-10 animate-in fade-in duration-500 pb-16">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {drawnCards.map((c, i) => (
                    <div key={i} className={`p-4 marker-border border-marker-black bg-white/40 flex flex-col items-center justify-center text-center aspect-[2/3] sm:aspect-[2/3.5] ${c.isReversed ? 'rotate-180' : ''} transition-all hover:scale-105 duration-300 shadow-sm hover:shadow-lg`}>
                       <span className="handwritten text-[10px] text-marker-black/30 mb-2">Card {i+1}</span>
                       <span className="heading-marker text-2xl md:text-xl text-marker-black leading-tight uppercase">{c.name}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-8 md:p-10 marker-border border-marker-blue bg-white/40 shadow-xl relative">
                   <div className="flex justify-between items-center mb-4 border-b-2 border-marker-blue/10 pb-2">
                     <span className="handwritten text-xs font-bold uppercase text-marker-blue">Interpretation</span>
                     <ReadAloudButton text={reading.interpretation} className="!py-1 !px-2 !text-xs bg-marker-blue/10 border-marker-blue/20 text-marker-blue" />
                   </div>
                   <p className="handwritten text-2xl italic text-marker-black/80 leading-relaxed">"{reading.interpretation}"</p>
                </div>

                <div className="p-8 md:p-10 marker-border border-marker-red bg-white/40 text-center">
                   <div className="flex justify-center items-center gap-4 mb-4">
                      <span className="handwritten text-xs text-marker-red uppercase font-bold"><GlossaryTerm word="Symbol">Core Message</GlossaryTerm></span>
                      <ReadAloudButton text={reading.guidance} className="!py-1 !px-2 !text-xs bg-marker-red/10 border-marker-red/20 text-marker-red" />
                   </div>
                   <p className="heading-marker text-4xl text-marker-black lowercase">
                      {reading.guidance}
                   </p>
                </div>
             </div>
           )}

           {!loading && !reading && !isShuffling && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none">
                <div className="text-[10rem] heading-marker text-marker-black leading-none">VOID</div>
                <p className="handwritten text-2xl mt-4">awaiting <GlossaryTerm word="Frequency">frequency</GlossaryTerm>...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TarotTool;
