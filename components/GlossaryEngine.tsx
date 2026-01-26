
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { getWordDefinition } from '../services/geminiService';
import { GlossaryDefinition } from '../types';

interface GlossaryContextType {
  inspectWord: (word: string) => void;
  updatePosition: (x: number, y: number) => void;
  hideInspector: () => void;
  cancelHide: () => void;
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export const GlossaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTerm, setActiveTerm] = useState<GlossaryDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Direct DOM manipulation for high-performance cursor tracking
  const updatePosition = useCallback((x: number, y: number) => {
    if (tooltipRef.current) {
      const offsetX = 20;
      const offsetY = 20;
      
      // Calculate proposed position
      let left = x + offsetX;
      let top = y + offsetY;
      
      // Screen boundaries
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const tooltipWidth = Math.min(340, screenWidth - 20); // Responsive width cap
      const tooltipHeight = tooltipRef.current.offsetHeight || 200; // Est height if not rendered yet

      // Horizontal Flip/Shift
      if (left + tooltipWidth > screenWidth) {
        // Try flipping to left
        left = x - tooltipWidth - offsetX;
        
        // If left side is also off-screen, just center it roughly or clamp
        if (left < 10) {
           left = Math.max(10, screenWidth - tooltipWidth - 10);
        }
      }

      // Vertical Flip/Shift
      if (top + tooltipHeight > screenHeight) {
        top = y - tooltipHeight - offsetY;
        if (top < 10) top = 10;
      }

      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${top}px`;
    }
  }, []);

  const inspectWord = useCallback(async (word: string) => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    // Only update if visibility changes or word changes
    if (activeTerm?.word === word && isVisible) return;

    setIsVisible(true);
    setCopied(false);

    if (activeTerm?.word !== word) {
       setLoading(true);
       setActiveTerm({ word, definition: 'Resolving...' });
       const data = await getWordDefinition(word);
       if (data) {
         setActiveTerm(data);
       } else {
         setActiveTerm({ word, definition: 'Definition signal lost.' });
       }
       setLoading(false);
    }
  }, [activeTerm, isVisible]);

  const hideInspector = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setActiveTerm(null);
      setCopied(false);
      hideTimerRef.current = null;
    }, 400); // 400ms grace period to allow moving mouse into tooltip
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTerm?.definition) {
      navigator.clipboard.writeText(activeTerm.definition);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <GlossaryContext.Provider value={{ inspectWord, updatePosition, hideInspector, cancelHide }}>
      {children}
      
      <div 
        ref={tooltipRef}
        className="fixed z-[9999] pointer-events-auto transition-opacity duration-300 ease-out max-w-[92vw] w-[340px]"
        style={{ 
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? 'visible' : 'hidden',
          left: 0, 
          top: 0 
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={hideInspector}
        onTouchStart={cancelHide} // Keep open on touch interaction
      >
        {activeTerm && (
           <div className="w-full backdrop-blur-xl bg-white/95 border border-white/50 shadow-[0_8px_32px_rgba(15,23,42,0.15)] rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              
              {/* Decorative Top Shine */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-marker-blue/0 via-marker-blue/30 to-marker-blue/0"></div>
              
              <div className="flex justify-between items-start mb-3">
                 <div className="flex-1 pr-2">
                    <div className="handwritten text-[10px] uppercase tracking-[0.2em] text-marker-blue/70 font-bold mb-1 flex items-center gap-2">
                       <span>{activeTerm.etymology || 'Lexicon'}</span>
                    </div>
                    <h4 className="heading-marker text-3xl text-marker-black lowercase leading-none break-words">
                       {activeTerm.word}
                    </h4>
                 </div>
                 
                 <button 
                   onClick={handleCopy}
                   className="p-2 hover:bg-marker-black/5 rounded-xl transition-all group active:scale-95 shrink-0"
                   title="Copy Definition"
                 >
                   {copied ? (
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--marker-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   ) : (
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-marker-black/30 group-hover:text-marker-blue transition-colors"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                   )}
                 </button>
              </div>

              <div className="w-8 h-0.5 bg-marker-black/10 mb-4 rounded-full"></div>

              <p className="handwritten text-xl leading-relaxed text-marker-black/80 font-medium">
                 {loading && activeTerm.definition.includes('Resolving') ? (
                   <span className="animate-pulse opacity-60 italic">{activeTerm.definition}</span>
                 ) : (
                   activeTerm.definition
                 )}
              </p>
              
              {/* Background ambient glow */}
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br from-marker-blue/5 to-marker-purple/5 rounded-full blur-2xl pointer-events-none"></div>
           </div>
        )}
      </div>
      
      <style>{`
        .glossary-term {
          cursor: help;
          position: relative;
          display: inline-block;
          border-bottom: 1.5px dashed rgba(30, 58, 138, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glossary-term::after {
          content: '';
          position: absolute;
          inset: -2px -4px;
          background: rgba(30, 58, 138, 0.08);
          border-radius: 4px;
          transform: scaleX(0.8) scaleY(0.5);
          opacity: 0;
          transition: all 0.2s ease;
          z-index: -1;
        }

        .glossary-term:hover, .glossary-term:active {
          color: var(--marker-blue);
          border-bottom-color: transparent;
          text-shadow: 0 0 20px rgba(30, 58, 138, 0.2);
        }
        
        .glossary-term:hover::after, .glossary-term:active::after {
           transform: scale(1);
           opacity: 1;
        }
      `}</style>
    </GlossaryContext.Provider>
  );
};

export const useGlossary = () => {
  const context = useContext(GlossaryContext);
  if (!context) throw new Error("useGlossary must be used within a GlossaryProvider");
  return context;
};

export const GlossaryTerm: React.FC<{ word: string, children: React.ReactNode }> = ({ word, children }) => {
  const { inspectWord, updatePosition, hideInspector, cancelHide } = useGlossary();
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    cancelHide();
    updatePosition(e.clientX, e.clientY);
    inspectWord(word);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  };
  
  return (
    <span 
      className="glossary-term"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={hideInspector}
      onTouchStart={(e) => {
        // e.preventDefault(); // Optional: might block scrolling if used
        const touch = e.touches[0];
        cancelHide();
        updatePosition(touch.clientX, touch.clientY);
        inspectWord(word);
      }}
    >
      {children}
    </span>
  );
};
