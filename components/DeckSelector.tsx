import React, { useState } from 'react';
import { getDeckRecommendation } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { ReadAloudButton } from './ReadAloudButton';
import { useSyllabusStore } from '../store';

interface Question {
  id: string;
  prompt: string;
  options: {
    text: string;
    weight: Record<string, number>;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'aesthetic',
    prompt: 'Which visual language speaks most clearly to you?',
    options: [
      { text: 'Clean lines, geometric forms, minimal ornamentation', weight: { modern: 2, structured: 1 } },
      { text: 'Rich detail, layered symbolism, classical imagery', weight: { traditional: 2, esoteric: 1 } },
      { text: 'Organic shapes, flowing forms, nature-inspired', weight: { intuitive: 2, earthy: 1 } },
      { text: 'Abstract concepts, surreal juxtapositions, dreamlike', weight: { experimental: 2, psychological: 1 } },
    ],
  },
  {
    id: 'approach',
    prompt: 'When seeking guidance, you prefer frameworks that are:',
    options: [
      { text: 'Precise and systematic, with clear correspondences', weight: { structured: 2, traditional: 1 } },
      { text: 'Open to interpretation, inviting personal meaning', weight: { intuitive: 2, modern: 1 } },
      { text: 'Rooted in mythology and archetypal narratives', weight: { esoteric: 2, psychological: 1 } },
      { text: 'Connected to natural cycles and earthly wisdom', weight: { earthy: 2, intuitive: 1 } },
    ],
  },
  {
    id: 'symbolism',
    prompt: 'Which symbolic vocabulary resonates most deeply?',
    options: [
      { text: 'Celestial bodies, planets, zodiacal glyphs', weight: { traditional: 2, esoteric: 1 } },
      { text: 'Animals, plants, elements, seasonal cycles', weight: { earthy: 2, intuitive: 1 } },
      { text: 'Archetypal figures, mythic journeys, universal themes', weight: { psychological: 2, esoteric: 1 } },
      { text: 'Contemporary iconography, cultural synthesis, new forms', weight: { modern: 2, experimental: 1 } },
    ],
  },
  {
    id: 'complexity',
    prompt: 'Your ideal divinatory system offers:',
    options: [
      { text: 'Deep historical lineage and established meanings', weight: { traditional: 2, structured: 1 } },
      { text: 'Flexibility to develop personal relationships with images', weight: { intuitive: 2, experimental: 1 } },
      { text: 'Rich symbolic networks and esoteric correspondences', weight: { esoteric: 2, structured: 1 } },
      { text: 'Direct, accessible wisdom without extensive study', weight: { modern: 1, intuitive: 1, earthy: 1 } },
    ],
  },
  {
    id: 'practice',
    prompt: 'In your practice, you are drawn to:',
    options: [
      { text: 'Solitary contemplation and introspective work', weight: { psychological: 2, intuitive: 1 } },
      { text: 'Ceremonial elements and ritual frameworks', weight: { traditional: 2, esoteric: 1 } },
      { text: 'Integration with daily life and practical wisdom', weight: { earthy: 2, modern: 1 } },
      { text: 'Experimental approaches and personal innovation', weight: { experimental: 2, modern: 1 } },
    ],
  },
  {
    id: 'color',
    prompt: 'Which color palette calls to you?',
    options: [
      { text: 'Gold, deep purples, celestial blues', weight: { traditional: 1, esoteric: 2 } },
      { text: 'Earth tones, forest greens, natural ochres', weight: { earthy: 2, intuitive: 1 } },
      { text: 'Monochrome, stark contrasts, minimal hues', weight: { modern: 2, structured: 1 } },
      { text: 'Vibrant, unexpected, emotionally charged', weight: { experimental: 2, psychological: 1 } },
    ],
  },
];

const DeckMatcher: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    modern: 0,
    traditional: 0,
    esoteric: 0,
    intuitive: 0,
    earthy: 0,
    psychological: 0,
    structured: 0,
    experimental: 0,
  });
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { recordCalculation } = useSyllabusStore();

  const handleAnswer = (weights: Record<string, number>) => {
    const newScores = { ...scores };
    Object.entries(weights).forEach(([key, value]) => {
      newScores[key] = (newScores[key] || 0) + value;
    });
    setScores(newScores);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz complete, get recommendation
      generateRecommendation(newScores);
    }
  };

  const generateRecommendation = async (finalScores: Record<string, number>) => {
    setLoading(true);
    const profile = Object.entries(finalScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => key)
      .join(', ');

    const result = await getDeckRecommendation(profile, finalScores);
    setRecommendation(result);
    recordCalculation();
    setLoading(false);
  };

  const restart = () => {
    setCurrentQuestion(0);
    setScores({
      modern: 0,
      traditional: 0,
      esoteric: 0,
      intuitive: 0,
      earthy: 0,
      psychological: 0,
      structured: 0,
      experimental: 0,
    });
    setRecommendation(null);
  };

  const progressPercent = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full max-w-4xl space-y-16">
        <header className="text-center space-y-4">
          <h2 className="heading-marker text-6xl text-marker-purple lowercase">
            <GlossaryTerm word="Oracle">Deck</GlossaryTerm> Matcher
          </h2>
          <p className="handwritten text-lg text-marker-purple opacity-60">
            <GlossaryTerm word="Divination">Divinatory</GlossaryTerm> System Consultation
          </p>
          <div className="w-full h-px bg-marker-black/10 mt-8"></div>
        </header>

        {!recommendation && !loading && (
          <div className="space-y-12">
            {/* Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="handwritten text-xs uppercase tracking-widest text-marker-black opacity-40">
                  Question {currentQuestion + 1} of {QUESTIONS.length}
                </span>
                <span className="heading-marker text-2xl text-marker-purple">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-1 bg-marker-black/5 overflow-hidden marker-border">
                <div 
                  className="h-full bg-marker-purple transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="heading-marker text-4xl text-marker-black lowercase leading-tight">
                {QUESTIONS[currentQuestion].prompt}
              </h3>

              {/* Options */}
              <div className="space-y-4">
                {QUESTIONS[currentQuestion].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option.weight)}
                    className="w-full p-6 text-left marker-border border-marker-black/10 bg-white/40 hover:bg-marker-purple/5 hover:border-marker-purple/30 transition-all group"
                  >
                    <span className="handwritten text-xl text-marker-black group-hover:text-marker-purple transition-colors">
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-8">
            <div className="w-20 h-20 border-4 border-marker-purple border-t-transparent animate-spin rounded-full"></div>
            <span className="handwritten text-xl text-marker-purple animate-pulse italic">
              Consulting the <GlossaryTerm word="Archive">archive</GlossaryTerm>...
            </span>
          </div>
        )}

        {recommendation && !loading && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Deck Title */}
            <div className="text-center space-y-4 pb-8 border-b-2 border-marker-purple/10">
              <div className="handwritten text-xs uppercase tracking-[0.5em] text-marker-black opacity-40">
                Your Match
              </div>
              <h3 className="heading-marker text-6xl text-marker-purple lowercase leading-tight">
                {recommendation.deckName}
              </h3>
              <p className="handwritten text-lg text-marker-black opacity-60 italic">
                {recommendation.creator}
              </p>
            </div>

            {/* Description */}
            <div className="p-8 marker-border border-marker-purple bg-white/60 shadow-xl relative">
              <div className="flex justify-between items-center mb-6 border-b-2 border-marker-purple/10 pb-3">
                <span className="handwritten text-xs font-bold uppercase text-marker-purple tracking-widest">
                  <GlossaryTerm word="Resonance">Resonance</GlossaryTerm> Analysis
                </span>
                <ReadAloudButton 
                  text={`${recommendation.description}. ${recommendation.whyMatch}`} 
                  className="!py-1 !px-3 !text-xs bg-marker-purple/10 border-marker-purple/20 text-marker-purple" 
                />
              </div>
              <p className="handwritten text-2xl italic text-marker-black font-light leading-relaxed">
                {recommendation.description}
              </p>
            </div>

            {/* Why This Deck */}
            <div className="p-8 marker-border border-marker-black/10 bg-white/40">
              <span className="handwritten text-xs font-bold uppercase text-marker-black/40 tracking-widest block mb-4">
                Alignment
              </span>
              <p className="heading-marker text-3xl text-marker-black lowercase leading-snug">
                {recommendation.whyMatch}
              </p>
            </div>

            {/* Key Themes */}
            {recommendation.keyThemes && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendation.keyThemes.map((theme: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-marker-purple/5 border-l-4 border-marker-purple"
                  >
                    <span className="handwritten text-sm font-bold text-marker-purple uppercase tracking-widest">
                      {theme}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Where to Find */}
            {recommendation.whereToFind && (
              <div className="p-6 bg-marker-black/5 marker-border border-marker-black/10">
                <span className="handwritten text-xs uppercase tracking-widest text-marker-black opacity-40 block mb-3">
                  Acquisition
                </span>
                <p className="handwritten text-base text-marker-black/80">
                  {recommendation.whereToFind}
                </p>
              </div>
            )}

            {/* Restart */}
            <div className="flex justify-center pt-8">
              <button 
                onClick={restart}
                className="brutalist-button !py-4 !px-8 !text-lg"
              >
                Begin New Consultation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckMatcher;
