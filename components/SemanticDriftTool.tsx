
import React, { useState, useEffect } from 'react';
import { generateSemanticQuiz } from '../services/geminiService';
import { useSyllabusStore } from '../store';
import { GlossaryTerm } from './GlossaryEngine';

interface Question {
  word: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SemanticDriftTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'end'>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { recordCalculation } = useSyllabusStore();

  const handleStart = async () => {
    setLoading(true);
    const quizData = await generateSemanticQuiz();
    if (quizData) {
      setQuestions(quizData as Question[]);
      setGameState('playing');
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setShowFeedback(false);
    }
    setLoading(false);
  };

  const handleOptionClick = (idx: number) => {
    if (showFeedback) return;
    setSelectedOption(idx);
    setShowFeedback(true);
    
    if (idx === questions[currentIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setGameState('end');
      recordCalculation();
    }
  };

  const getRank = (score: number, total: number) => {
    const percentage = score / total;
    if (percentage === 1) return "Lexical Architect";
    if (percentage >= 0.8) return "Etymologist";
    if (percentage >= 0.5) return "Adept";
    return "Neophyte";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-5xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      {/* Header */}
      <header className="w-full text-center space-y-4 mb-16">
        <h2 className="heading-marker text-6xl text-marker-green lowercase"><GlossaryTerm word="Semantic Drift">Semantic Drift</GlossaryTerm></h2>
        <p className="handwritten text-xl text-marker-green opacity-60"><GlossaryTerm word="Linguistics">Linguistic</GlossaryTerm> Literacy Assessment</p>
        <div className="w-64 h-2 bg-marker-green/20 marker-border mx-auto"></div>
      </header>

      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px]">
        {gameState === 'intro' && (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <p className="handwritten text-2xl text-marker-black leading-relaxed">
              Words are tools. But tools rust, warp, and change shape over centuries.
              <br/><br/>
              This assessment calculates your ability to discern the <strong>true origins</strong> and <strong>shifted meanings</strong> of the <GlossaryTerm word="Language">language</GlossaryTerm> you use to think.
            </p>
            <button 
              onClick={handleStart}
              disabled={loading}
              className="brutalist-button px-12 py-6 text-2xl !bg-marker-green/10 !border-marker-green !text-marker-green hover:!bg-marker-green hover:!text-white"
            >
              {loading ? 'Calibrating Lexicon...' : 'Begin Assessment'}
            </button>
          </div>
        )}

        {gameState === 'playing' && questions.length > 0 && (
          <div className="w-full max-w-3xl space-y-8 animate-in fade-in duration-300">
             <div className="flex justify-between items-end border-b-2 border-marker-black/10 pb-4">
               <span className="handwritten text-sm text-marker-black opacity-40 uppercase tracking-widest">Question {currentIndex + 1} / {questions.length}</span>
               <span className="heading-marker text-3xl text-marker-black">Score: {score}</span>
             </div>

             <div className="space-y-6">
               <h3 className="heading-marker text-7xl text-marker-black mb-6">{questions[currentIndex].word}</h3>
               <p className="handwritten text-2xl text-marker-black/80 font-bold italic"><GlossaryTerm word="Meaning">{questions[currentIndex].question}</GlossaryTerm></p>
             </div>

             <div className="grid grid-cols-1 gap-4">
               {questions[currentIndex].options.map((opt, i) => {
                 let btnClass = "bg-white/50 border-marker-black/10 text-marker-black hover:border-marker-black";
                 
                 if (showFeedback) {
                   if (i === questions[currentIndex].correctIndex) {
                     btnClass = "bg-marker-green/20 border-marker-green text-marker-green font-bold";
                   } else if (i === selectedOption) {
                     btnClass = "bg-marker-red/20 border-marker-red text-marker-red opacity-60";
                   } else {
                     btnClass = "opacity-40 border-transparent";
                   }
                 }

                 return (
                   <button
                     key={i}
                     onClick={() => handleOptionClick(i)}
                     disabled={showFeedback}
                     className={`p-6 text-left marker-border handwritten text-lg transition-all ${btnClass}`}
                   >
                     {opt}
                   </button>
                 );
               })}
             </div>

             {showFeedback && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-6 bg-marker-black/5 marker-border border-marker-black/10 space-y-4">
                 <span className="handwritten text-xs font-bold uppercase tracking-widest opacity-40 block"><GlossaryTerm word="Etymology">Etymological Note</GlossaryTerm></span>
                 <p className="handwritten text-xl italic text-marker-black leading-relaxed">
                   "{questions[currentIndex].explanation}"
                 </p>
                 <div className="flex justify-end pt-4">
                   <button onClick={handleNext} className="brutalist-button !text-lg !py-2 !px-8">
                     {currentIndex === questions.length - 1 ? 'Finish' : 'Next Vector'}
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}

        {gameState === 'end' && (
          <div className="text-center space-y-12 animate-in zoom-in-95 duration-500 w-full max-w-2xl">
             <div className="space-y-4">
               <span className="handwritten text-sm text-marker-black opacity-40 uppercase tracking-widest">Assessment Complete</span>
               <h3 className="heading-marker text-8xl text-marker-black">{score} / {questions.length}</h3>
             </div>

             <div className="p-10 marker-border border-marker-green bg-white shadow-xl">
                <span className="handwritten text-sm font-bold uppercase text-marker-green tracking-widest block mb-4"><GlossaryTerm word="Lexicon">Linguistic Literacy</GlossaryTerm> Rank</span>
                <p className="heading-marker text-5xl text-marker-black lowercase">{getRank(score, questions.length)}</p>
             </div>

             <button onClick={() => setGameState('intro')} className="handwritten text-xl underline decoration-2 underline-offset-4 decoration-marker-green/40 hover:decoration-marker-green hover:text-marker-green transition-all">
               Re-calibrate
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticDriftTool;
