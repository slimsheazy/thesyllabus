
import React, { useState } from 'react';
import { getQuoteWall } from '../services/geminiService';

const themes = ["void", "entropy", "gnosis", "frequency", "rebirth", "logic"];

const QuoteWall: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentTheme, setCurrentTheme] = useState('void');
  const [quotes, setQuotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    const result = await getQuoteWall(currentTheme);
    setQuotes(result);
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
      
      <div className="w-full space-y-16">
        <header className="text-center space-y-4">
          <h2 className="heading-marker text-7xl text-marker-purple lowercase">Wisdom Wall</h2>
          <p className="handwritten text-xl text-marker-purple opacity-60">Archive of Insights</p>
          <div className="w-full h-px bg-marker-black/10 marker-border mt-8"></div>
        </header>

        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-wrap justify-center gap-4">
            {themes.map(t => (
              <button 
                key={t}
                onClick={() => setCurrentTheme(t)}
                className={`px-6 py-2 marker-border handwritten text-sm font-bold tracking-widest transition-all ${
                  currentTheme === t ? 'bg-marker-purple/10 border-marker-purple text-marker-purple' : 'border-marker-black/10 text-marker-black opacity-40 hover:opacity-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchQuotes} 
            disabled={loading} 
            className="brutalist-button w-full max-w-md !py-6"
          >
            {loading ? 'Gathering insights...' : 'Refresh Wisdom Wall'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
          {quotes.length > 0 ? quotes.map((q, i) => (
            <div key={i} className="p-12 marker-border border-marker-black/5 bg-white/40 flex items-center justify-center text-center hover:scale-102 transition-transform shadow-sm min-h-[300px]">
               <p className="heading-marker text-3xl text-marker-black leading-tight">"{q}"</p>
            </div>
          )) : !loading && (
            <div className="col-span-full text-center opacity-10 py-32">
              <p className="handwritten text-2xl italic">no signals found // awaiting selection...</p>
            </div>
          )}
          {loading && (
             <div className="col-span-full flex flex-col items-center justify-center py-32 gap-6">
                <div className="w-16 h-16 border-4 border-marker-purple border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-xl text-marker-purple animate-pulse">Accessing Library...</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteWall;
