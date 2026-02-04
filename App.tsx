
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Page } from './types';
import { useSyllabusStore } from './store';
import { initDB } from './services/dbService';
import { GlossaryProvider, GlossaryTerm } from './components/GlossaryEngine';
import { getWordDefinition } from './services/geminiService';

// Lazy Load Tools to optimize initial bundle size
const HoraryTool = React.lazy(() => import('./components/HoraryTool'));
const ElectionalTool = React.lazy(() => import('./components/ElectionalTool'));
const NumerologyTool = React.lazy(() => import('./components/NumerologyTool'));
const SigilMaker = React.lazy(() => import('./components/SigilMaker'));
const Archive = React.lazy(() => import('./components/Archive'));
const CosmicMadLibs = React.lazy(() => import('./components/CosmicMadLibs'));
const FriendshipMatrix = React.lazy(() => import('./components/FriendshipMatrix'));
const BaziTool = React.lazy(() => import('./components/BaziTool'));
const BioCalcTool = React.lazy(() => import('./components/BioCalcTool'));
const FlyingStarTool = React.lazy(() => import('./components/FlyingStarTool'));
const PieDeconstructionTool = React.lazy(() => import('./components/PieDeconstructionTool'));
const ColorPaletteTool = React.lazy(() => import('./components/ColorPaletteTool'));
const BiorhythmTool = React.lazy(() => import('./components/BiorhythmTool'));
const SemanticDriftTool = React.lazy(() => import('./components/SemanticDriftTool'));
const CharmCastingTool = React.lazy(() => import('./components/CharmCastingTool'));
const BirthChartTool = React.lazy(() => import('./components/BirthChartTool'));
const TarotTool = React.lazy(() => import('./components/TarotTool'));
const AstroMapTool = React.lazy(() => import('./components/AstroMapTool'));
const LostItemFinder = React.lazy(() => import('./components/LostItemFinder'));
const DeckSelector = React.lazy(() => import('./components/DeckSelector'));

// --- Configuration ---

const MENU_CATEGORIES = [
  {
    label: "Oracles & Scrying",
    color: "var(--marker-purple)",
    items: [
      { name: "Tarot Synth", page: Page.TAROT },
      { name: "Horary Moment", page: Page.HORARY },
      { name: "Electional Finder", page: Page.ELECTIONAL },
      { name: "Charm Caster", page: Page.CHARM_CASTING },
      { name: "Lost Item Locator", page: Page.LOST_ITEM_FINDER },
      { name: "Friendship Matrix", page: Page.FRIENDSHIP_MATRIX },
      { name: "Deck Matcher", page: Page.DECK_SELECTOR },
    ]
  },
  {
    label: "Astral Schematics",
    color: "var(--marker-blue)",
    items: [
      { name: "Natal Engine", page: Page.BIRTH_CHART },
      { name: "Relocation Mapper", page: Page.ASTRO_MAP },
      { name: "Four Pillars Engine", page: Page.BAZI },
      { name: "Flying Star Mapper", page: Page.FLYING_STAR },
      { name: "Life Path Reader", page: Page.NUMEROLOGY },
    ]
  },
  {
    label: "Bio-Rhythms",
    color: "var(--marker-red)",
    items: [
      { name: "Vitality Gauge", page: Page.BIO_CALC },
      { name: "Biorhythm Capacity", page: Page.BIORHYTHM },
    ]
  },
  {
    label: "Arcane Praxis",
    color: "var(--marker-green)",
    items: [
      { name: "Sigil Engine", page: Page.SIGIL_MAKER },
      { name: "Ritual Workshop", page: Page.MAD_LIBS },
      { name: "Zodiacal Palette", page: Page.COLOR_PALETTE },
      { name: "Semantic Drift Quiz", page: Page.SEMANTIC_DRIFT },
      { name: "Semantic Trace", page: Page.PIE_DECONSTRUCTION },
      { name: "The Archive", page: Page.ARCHIVE },
    ]
  }
];

// Map Pages to Components for cleaner routing
const TOOL_COMPONENTS: Partial<Record<Page, React.ComponentType<{ onBack: () => void }>>> = {
  [Page.HORARY]: HoraryTool,
  [Page.ELECTIONAL]: ElectionalTool,
  [Page.NUMEROLOGY]: NumerologyTool,
  [Page.SIGIL_MAKER]: SigilMaker,
  [Page.ARCHIVE]: Archive,
  [Page.MAD_LIBS]: CosmicMadLibs,
  [Page.FRIENDSHIP_MATRIX]: FriendshipMatrix,
  [Page.BAZI]: BaziTool,
  [Page.BIO_CALC]: BioCalcTool,
  [Page.FLYING_STAR]: FlyingStarTool,
  [Page.PIE_DECONSTRUCTION]: PieDeconstructionTool,
  [Page.COLOR_PALETTE]: ColorPaletteTool,
  [Page.BIORHYTHM]: BiorhythmTool,
  [Page.SEMANTIC_DRIFT]: SemanticDriftTool,
  [Page.CHARM_CASTING]: CharmCastingTool,
  [Page.BIRTH_CHART]: BirthChartTool,
  [Page.ASTRO_MAP]: AstroMapTool,
  [Page.LOST_ITEM_FINDER]: LostItemFinder,
  [Page.TAROT]: TarotTool,
  [Page.DECK_SELECTOR]: DeckSelector
};

const SYLLABUS_WORDS = [
  "Paradigm", "Entropy", "Recursion", "Dialectic", "Ontology",
  "Epistemology", "Heuristic", "Algorithm", "Cognition", "Phenomenology",
  "Gestalt", "Isomorphism", "Homology", "Symbiosis", "Catalyst",
  "Inertia", "Velocity", "Trajectory", "Resonance", "Spectrum",
  "Gradient", "Vector", "Topography", "Syntax", "Context",
  "Nuance", "Bias", "Fallacy", "Axiom", "Hypothesis",
  "Variable", "Theorem", "Equilibrium", "Synthesis", "Analysis",
  "Logic", "Reason", "Schema", "Structure", "System",
  "Function", "Method", "Theory", "Metric", "Datum",
  "Archetype", "Egregore", "Liminality", "Simulacrum", "Hyperstition", 
  "Cybernetics", "Noosphere", "Semiotics", "Hermeneutics", "Teleology", 
  "Sublimation", "Transmute", "Fractal", "Hologram", "Quantum", 
  "Entanglement", "Superposition", "Tensor", "Manifold", "Geodesic", 
  "Parallax", "Azimuth", "Zenith", "Nadir", "Syzygy", 
  "Occultation", "Ephemeris", "Stochastic", "Deterministic", "Empirical", 
  "Anecdotal", "Qualia", "Noumenon", "Phenomenon", "Paradox", 
  "Dichotomy", "Dualism", "Monism", "Solipsism", "Metaphysics", 
  "Aesthetics", "Ethics", "Rhetoric", "Semantics", "Pragmatics",
  "Morphology", "Phylogeny", "Taxonomy", "Osmosis", "Homeostasis",
  "Allostasis", "Hysteresis", "Bifurcation", "Singularity", "Horizon",
  "Vertex", "Vortex", "Flux", "Flow", "Current",
  "Signal", "Noise", "Information", "Code", "Cipher",
  "Symbol", "Icon", "Index", "Signifier", "Signified",
  "Metaphor", "Allegory", "Analogy", "Simile", "Trope",
  "Meme", "Gene", "Holon", "Monad", "Dyad",
  "Triad", "Tetrad", "Pentad", "Hexad", "Heptad",
  "Ogdoad", "Ennead", "Decad", "Avatar", "Daemon",
  "Tulpa", "Servitor", "Fetish", "Totem", "Talisman",
  "Amulet", "Sigil", "Glyph", "Rune", "Character"
];

// --- Sub-Components ---

const MenuButton: React.FC<{ isOpen: boolean; toggle: () => void }> = ({ isOpen, toggle }) => (
  <button 
    onClick={toggle}
    className="fixed top-6 left-6 z-[110] w-12 h-12 flex flex-col items-center justify-center gap-1.5 bg-white border-2 border-marker-black rounded-lg hover:shadow-md transition-all group"
    aria-label="Toggle Menu"
  >
    <div className={`w-6 h-0.5 bg-marker-black transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
    <div className={`w-6 h-0.5 bg-marker-black transition-all ${isOpen ? 'opacity-0' : ''}`} />
    <div className={`w-6 h-0.5 bg-marker-black transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
  </button>
);

const NavigationOverlay: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onNavigate: (page: Page) => void 
}> = ({ isOpen, onClose, onNavigate }) => {
  const { isEclipseMode, toggleEclipseMode } = useSyllabusStore();
  
  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md" onClick={onClose} />
      <div className={`absolute top-0 left-0 h-full w-full md:w-[400px] bg-white border-r border-marker-black/10 transition-transform duration-500 shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 pt-24 flex-grow overflow-y-auto">
          <div className="handwritten text-xs text-marker-black opacity-40 uppercase tracking-widest mb-10 pb-4 border-b border-marker-black/5">Syllabus Index</div>
          <div className="space-y-12">
            {MENU_CATEGORIES.map((cat, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: cat.color }}></div>
                   <span className="heading-marker text-2xl text-marker-black uppercase tracking-wide">{cat.label}</span>
                </div>
                <ul className="space-y-1 pl-5 border-l border-marker-black/5">
                  {cat.items.map((item, j) => (
                    <li key={j}>
                      <button 
                        onClick={() => onNavigate(item.page)}
                        className="w-full text-left handwritten text-lg font-bold text-marker-black hover:text-marker-blue transition-colors py-1 px-4 rounded-md hover:bg-marker-black/5"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            <div className="pt-8 mt-8 border-t border-marker-black/5">
               <button 
                 onClick={toggleEclipseMode}
                 className="w-full flex items-center justify-between group p-2 hover:bg-marker-black/5 rounded-lg transition-colors"
               >
                 <span className="handwritten text-sm font-bold uppercase tracking-widest text-marker-black group-hover:text-marker-purple transition-colors">Eclipse Mode</span>
                 <div className={`w-10 h-6 rounded-full border-2 relative transition-all ${isEclipseMode ? 'bg-marker-purple border-marker-purple' : 'bg-transparent border-marker-black/20'}`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-300 ${isEclipseMode ? 'left-[calc(100%-1.2rem)] bg-white' : 'left-0.5 bg-marker-black/40'}`}></div>
                 </div>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomeView: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [wordData, setWordData] = useState<{word: string, definition: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const seenWordsRef = useRef<Set<string>>(new Set());
  const [label, setLabel] = useState("Daily Concept");

  const loadWord = async (isDaily = false) => {
    if (loading) return;
    setLoading(true);
    setWordData(null); // Force loading state for UI feedback

    try {
      let targetWord = "";

      // 1. Determine Target Word
      if (isDaily) {
        const today = new Date().toISOString().split('T')[0];
        
        // Try Cache First
        const cacheKey = `syllabus_daily_v2_${today}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const data = JSON.parse(cached);
          setWordData(data);
          seenWordsRef.current.add(data.word);
          setLoading(false);
          return;
        }

        // Daily Calculation
        const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
        targetWord = SYLLABUS_WORDS[seed % SYLLABUS_WORDS.length];
        setLabel("Daily Concept");
      } else {
        // Random Selection (Non-Repeating)
        const available = SYLLABUS_WORDS.filter(w => !seenWordsRef.current.has(w));
        
        if (available.length === 0) {
          // Reset if all words seen, but keep the current one out to avoid instant repeat
          seenWordsRef.current.clear();
          // Exclude current word if possible
          const currentWord = wordData?.word;
          const pool = SYLLABUS_WORDS.filter(w => w !== currentWord);
          targetWord = pool[Math.floor(Math.random() * pool.length)];
        } else {
          targetWord = available[Math.floor(Math.random() * available.length)];
        }
        setLabel("Featured Concept");
      }

      // 2. Fetch Definition
      const def = await getWordDefinition(targetWord);
      if (def) {
        const data = { word: def.word, definition: def.definition };
        setWordData(data);
        seenWordsRef.current.add(def.word);
        
        // Cache if it was the daily fetch
        if (isDaily) {
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(`syllabus_daily_v2_${today}`, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error("Failed to fetch word:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWord(true);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-12">
      <div className="max-w-4xl w-full text-center space-y-8 flex flex-col items-center">
        
        {/* Header Branding */}
        <div className="space-y-4">
           <div className="inline-block px-3 py-1 border border-marker-black/10 rounded-full">
              <span className="handwritten text-xs font-medium uppercase tracking-widest text-marker-black/60">Esoteric Archive v1.0</span>
           </div>
           <h1 className="title-main text-marker-green">The Syllabus</h1>
           <p className="handwritten text-base text-marker-black/60 max-w-lg mx-auto leading-relaxed px-4">
             An open <GlossaryTerm word="repository">repository</GlossaryTerm> of ancient frameworks and modern <GlossaryTerm word="synthesis">synthesis</GlossaryTerm>.
           </p>
        </div>
        
        {/* Interactive Word Card */}
        <div 
          onClick={() => loadWord(false)}
          className="w-full max-w-lg marker-border bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-500 group relative overflow-hidden cursor-pointer"
          title="Click to reveal a new concept"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-marker-green/20 group-hover:bg-marker-green transition-colors"></div>
          
          <div className="flex justify-between items-start mb-4">
            <span className="handwritten text-xs font-bold uppercase tracking-[0.2em] text-marker-green opacity-80">{label}</span>
            <div className="flex items-center gap-2">
               <span className="text-[10px] uppercase font-bold text-marker-black/20 group-hover:text-marker-green/40 transition-colors">Click to Cycle</span>
               <span className="text-marker-black/20 text-xs font-mono">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          {wordData && !loading ? (
            <div className="space-y-3 text-left animate-in fade-in duration-300">
              <h3 className="heading-marker text-3xl text-marker-black break-words">{wordData.word}</h3>
              <p className="font-sans text-base text-marker-black/70 leading-relaxed border-l-2 border-marker-black/5 pl-4">
                {wordData.definition}
              </p>
            </div>
          ) : (
             <div className="flex flex-col items-center gap-3 py-8 opacity-40">
                <div className="w-6 h-6 border-2 border-marker-black border-t-transparent animate-spin rounded-full"></div>
             </div>
          )}
        </div>
        
        <div className="pt-6">
          <button onClick={onEnter} className="brutalist-button px-8 py-3 text-base bg-white hover:bg-marker-black/5">
            Open Library
          </button>
        </div>
      </div>
      
      <footer className="absolute bottom-8 w-full text-center">
        <span className="handwritten text-xs font-bold text-marker-black/30 uppercase tracking-[0.3em]">Knowledge is Free</span>
      </footer>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { updateLastAccess, isEclipseMode } = useSyllabusStore();

  useEffect(() => {
    updateLastAccess();
    initDB(); 
  }, [updateLastAccess]);

  useEffect(() => {
    if (isEclipseMode) {
      document.documentElement.classList.add('eclipse-mode');
    } else {
      document.documentElement.classList.remove('eclipse-mode');
    }
  }, [isEclipseMode]);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  const CurrentToolComponent = useMemo(() => TOOL_COMPONENTS[currentPage], [currentPage]);

  return (
    <GlossaryProvider>
      <div className="min-h-screen relative selection:bg-marker-green/10 selection:text-marker-green">
        
        <MenuButton 
          isOpen={isMenuOpen} 
          toggle={() => setIsMenuOpen(!isMenuOpen)} 
        />

        <NavigationOverlay 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          onNavigate={handleNavigate} 
        />

        <main className="min-h-screen w-full">
          <div key={currentPage} className="animate-in fade-in duration-500">
            {currentPage === Page.HOME ? (
              <HomeView onEnter={() => setIsMenuOpen(true)} />
            ) : CurrentToolComponent ? (
              <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center h-screen w-full gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-marker-black/10 rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-marker-black border-t-transparent animate-spin rounded-full"></div>
                  </div>
                  <span className="handwritten text-xl text-marker-black animate-pulse uppercase tracking-widest italic">Loading Module...</span>
                </div>
              }>
                <CurrentToolComponent onBack={() => handleNavigate(Page.HOME)} />
              </React.Suspense>
            ) : null}
          </div>
        </main>

      </div>
    </GlossaryProvider>
  );
};

export default App;
