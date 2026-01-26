
import React, { useRef, useEffect, useState } from 'react';
import { getCharmReading } from '../services/geminiService';
import { useSyllabusStore } from '../store';
import { ReadAloudButton } from './ReadAloudButton';
import { GlossaryTerm, useGlossary } from './GlossaryEngine';

// Charm Definitions
const CHARMS = [
  { id: 'sun', icon: '☀️', name: 'The Sun', color: '#fbbf24' },
  { id: 'moon', icon: '🌙', name: 'The Moon', color: '#e2e8f0' },
  { id: 'key', icon: '🗝️', name: 'The Key', color: '#f59e0b' },
  { id: 'heart', icon: '❤️', name: 'The Heart', color: '#ef4444' },
  { id: 'skull', icon: '💀', name: 'The End', color: '#94a3b8' },
  { id: 'star', icon: '⭐', name: 'The Star', color: '#fcd34d' },
  { id: 'eye', icon: '👁️', name: 'The Eye', color: '#38bdf8' }
];

interface PhysicsCharm {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  scale: number; // For "dropping" z-axis effect
  settled: boolean;
  hasClanked: boolean;
}

const CharmCastingTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null); // For sound effects
  const [intent, setIntent] = useState('');
  const [isCasting, setIsCasting] = useState(false);
  const [hasCast, setHasCast] = useState(false);
  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Physics State Refs (Mutable for animation loop)
  const charmsRef = useRef<PhysicsCharm[]>([]);
  const animationRef = useRef<number>(0);
  const { recordCalculation } = useSyllabusStore();
  const { inspectWord, hideInspector, updatePosition, cancelHide } = useGlossary();

  // Initialize Audio Context on user interaction if needed
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playClank = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    
    // Main "clink"
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // High pitch for small metal object
    osc.frequency.setValueAtTime(2200 + Math.random() * 600, t);
    osc.connect(gain);
    
    // Overtone for metallic dissonance
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3200 + Math.random() * 600, t);
    osc2.connect(gain);

    // Sharp Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.15);
    osc2.start(t);
    osc2.stop(t + 0.15);
  };

  const getZone = (x: number, y: number, width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Center Void (Radius 10% of width)
    if (dist < width * 0.1) return "THE VOID (Center)";
    // Out of bounds (Radius 45% of width)
    if (dist > width * 0.48) return "THE ETHER (Out of Bounds)"; 

    // Calculate angle in degrees (0 to 360)
    // Adding 360 to ensure positive result
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // 12 Sectors of 30 degrees
    // Standard cartesian: 0 deg is 3 o'clock. 
    // Sector 1: 0-30 deg (House 1)
    const sector = Math.floor(angle / 30) + 1;
    
    const HOUSES = [
      "House I (Self)", 
      "House II (Value)", 
      "House III (Comm)", 
      "House IV (Roots)",
      "House V (Creation)", 
      "House VI (Routine)", 
      "House VII (Union)", 
      "House VIII (Alchemy)",
      "House IX (Expansion)", 
      "House X (Public)", 
      "House XI (Hopes)", 
      "House XII (Unconscious)"
    ];
    
    return HOUSES[sector - 1] || "Unknown Sector";
  };

  const initCharms = (width: number, height: number) => {
    // Start all charms in center with high random velocity outward
    return CHARMS.map(c => ({
      id: c.id,
      x: width / 2,
      y: height / 2,
      vx: (Math.random() - 0.5) * 45, // Explode outward
      vy: (Math.random() - 0.5) * 45,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.5,
      scale: 3.0, // Start large (close to camera)
      settled: false,
      hasClanked: false
    }));
  };

  const startCast = () => {
    if (!intent.trim() || !canvasRef.current) return;
    
    initAudio(); // Ensure audio is ready
    setIsCasting(true);
    setHasCast(false);
    setReading(null);
    
    const canvas = canvasRef.current;
    charmsRef.current = initCharms(canvas.width, canvas.height);
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animate();
  };

  const drawBoard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    
    ctx.clearRect(0, 0, width, height);

    // 1. Background Texture/Color
    const gradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.6);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // 2. The Wheel Structure (Concentric Rings)
    const radii = [0.1, 0.25, 0.45]; // relative to width (Void, Inner, Outer)
    
    // Outer Ring (Boundary)
    ctx.beginPath();
    ctx.arc(cx, cy, width * radii[2], 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
    ctx.stroke();

    // Middle Ring (Midpoint)
    ctx.beginPath();
    ctx.arc(cx, cy, width * radii[1], 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.15)';
    ctx.stroke();
    
    // Center Ring (Void)
    ctx.beginPath();
    ctx.arc(cx, cy, width * radii[0], 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a'; // Dark center
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // 3. Radial Lines (12 Sectors)
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      const rInner = width * radii[0];
      const rOuter = width * radii[2];
      
      ctx.beginPath();
      ctx.moveTo(cx + rInner * Math.cos(angle), cy + rInner * Math.sin(angle));
      ctx.lineTo(cx + rOuter * Math.cos(angle), cy + rOuter * Math.sin(angle));
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.2)';
      ctx.stroke();
    }

    // 4. Labels (Roman Numerals)
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    
    for (let i = 0; i < 12; i++) {
      // Position text in middle of sector
      const angle = (i * 30 + 15) * (Math.PI / 180);
      const rText = width * 0.38; // Near the outer edge
      
      ctx.save();
      ctx.translate(cx + rText * Math.cos(angle), cy + rText * Math.sin(angle));
      ctx.fillText(ROMANS[i], 0, 0);
      ctx.restore();
    }
    
    // 5. Center Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px Inter';
    ctx.fillText("VOID", cx, cy);

    // 6. Decorative Dashed Ring
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.1)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, width * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawCharm = (ctx: CanvasRenderingContext2D, charm: PhysicsCharm) => {
    const def = CHARMS.find(c => c.id === charm.id);
    if (!def) return;

    ctx.save();
    ctx.translate(charm.x, charm.y);
    ctx.rotate(charm.rot);
    ctx.scale(charm.scale, charm.scale);

    // 1. Drop Shadow
    const shadowOffset = (charm.scale - 1) * 8 + 4;
    ctx.beginPath();
    ctx.arc(shadowOffset, shadowOffset, 22, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${0.2 * (1/charm.scale)})`;
    ctx.fill();

    // 2. Silver Coin Body
    const grad = ctx.createLinearGradient(-20, -20, 20, 20);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.5, '#94a3b8');
    grad.addColorStop(1, '#475569');
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // 3. Inner Rim
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Icon
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, 0, 2);

    // 5. Specular Shine
    ctx.beginPath();
    ctx.ellipse(-8, -8, 8, 4, -Math.PI/4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    ctx.restore();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Physics Constants
    const FRICTION = 0.94;
    const WALL_BOUNCE = -0.6;
    const SCALE_DECAY = 0.96; 
    const MIN_SCALE = 1.0;

    let allSettled = true;

    drawBoard(ctx, canvas.width, canvas.height);

    charmsRef.current.forEach(charm => {
      if (!charm.settled) {
        // Position
        charm.x += charm.vx;
        charm.y += charm.vy;
        
        // Rotation
        charm.rot += charm.vRot;
        charm.vRot *= 0.98;

        // Scale (Falling effect)
        if (charm.scale > MIN_SCALE) {
          charm.scale *= SCALE_DECAY;
          if (charm.scale <= MIN_SCALE) {
            charm.scale = MIN_SCALE;
            if (!charm.hasClanked) {
              playClank();
              charm.hasClanked = true;
            }
          }
        }

        // Walls
        const r = 22 * charm.scale;
        if (charm.x - r < 0) { charm.x = r; charm.vx *= WALL_BOUNCE; }
        if (charm.x + r > canvas.width) { charm.x = canvas.width - r; charm.vx *= WALL_BOUNCE; }
        if (charm.y - r < 0) { charm.y = r; charm.vy *= WALL_BOUNCE; }
        if (charm.y + r > canvas.height) { charm.y = canvas.height - r; charm.vy *= WALL_BOUNCE; }

        // Friction
        charm.vx *= FRICTION;
        charm.vy *= FRICTION;

        // Stop condition
        if (Math.abs(charm.vx) < 0.1 && Math.abs(charm.vy) < 0.1 && charm.scale <= MIN_SCALE + 0.01) {
          charm.settled = true;
        } else {
          allSettled = false;
        }
      }
      drawCharm(ctx, charm);
    });

    if (!allSettled) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsCasting(false);
      setHasCast(true);
      handleInterpretation();
    }
  };

  const handleInterpretation = async () => {
    setLoading(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Map finalized positions to zones
    const finalData = charmsRef.current.map(c => {
      const def = CHARMS.find(d => d.id === c.id);
      return {
        name: def?.name || 'Unknown',
        zone: getZone(c.x, c.y, canvas.width, canvas.height)
      };
    });

    const result = await getCharmReading(finalData, intent);
    setReading(result);
    setLoading(false);
    recordCalculation();
  };

  const handleInteract = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    updatePosition(clientX, clientY);

    let hit = false;
    for (let i = charmsRef.current.length - 1; i >= 0; i--) {
      const c = charmsRef.current[i];
      const dx = x - c.x;
      const dy = y - c.y;
      const r = 25 * c.scale; 
      
      if (dx * dx + dy * dy < r * r) {
        const def = CHARMS.find(ch => ch.id === c.id);
        if (def) {
          inspectWord(def.name);
          cancelHide();
          hit = true;
        }
        break;
      }
    }

    if (!hit) {
      hideInspector();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInteract(e.clientX, e.clientY);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    handleInteract(touch.clientX, touch.clientY);
  };

  const handleCanvasLeave = () => {
    hideInspector();
  };

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) drawBoard(ctx, canvasRef.current.width, canvasRef.current.height);
    }
    
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

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
           <header className="space-y-4">
             <h2 className="heading-marker text-6xl text-marker-black lowercase">Charm Caster</h2>
             <p className="handwritten text-xl text-marker-black opacity-60"><GlossaryTerm word="Lithomancy">Lithomancy</GlossaryTerm> Board</p>
           </header>
           
           <div className="space-y-8">
             <div className="space-y-2">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Focus your <GlossaryTerm word="Intention">Intent</GlossaryTerm></label>
               <input 
                 value={intent}
                 onChange={(e) => setIntent(e.target.value)}
                 placeholder="What do you seek?"
                 className="w-full p-8 text-marker-black text-3xl shadow-sm italic placeholder:opacity-30 border-marker-black/20 focus:border-marker-black/40 bg-white/50"
               />
             </div>

             <button 
               onClick={startCast}
               disabled={isCasting || loading || !intent}
               className="brutalist-button w-full !py-8 !text-2xl shadow-xl border-marker-black"
             >
               {isCasting ? 'Charms in motion...' : 'Throw Charms'}
             </button>

             {/* Interpretation Output */}
             {reading && !loading && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-8 marker-border border-marker-blue bg-white shadow-xl">
                     <div className="flex justify-between items-center mb-4 border-b-2 border-marker-blue/10 pb-2">
                        <span className="handwritten text-sm font-black uppercase text-marker-blue tracking-widest">The Reading</span>
                        <ReadAloudButton text={`${reading.synthesis} ${reading.keyInsight}`} className="!py-1 !px-2 !text-xs bg-marker-blue/5 border-marker-blue/20 text-marker-blue" />
                     </div>
                     <p className="handwritten text-2xl italic text-marker-black/80 leading-relaxed">"{reading.synthesis}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {reading.charmDetails.map((detail: any, i: number) => (
                       <div key={i} className="p-6 marker-border border-marker-black/5 bg-white/40">
                         <span className="handwritten text-xs font-bold uppercase text-marker-black/40 block mb-2">
                           <GlossaryTerm word={detail.charm}>{detail.charm}</GlossaryTerm>
                         </span>
                         <p className="handwritten text-lg text-marker-black/80 leading-snug">{detail.meaning}</p>
                       </div>
                     ))}
                  </div>

                  <div className="p-8 marker-border border-marker-red bg-white/40">
                    <span className="handwritten text-xs font-bold uppercase text-marker-red tracking-widest block mb-4">Core Insight</span>
                    <p className="heading-marker text-4xl text-marker-black lowercase">{reading.keyInsight}</p>
                  </div>
               </div>
             )}
             
             {loading && (
               <div className="flex flex-col items-center justify-center py-12 gap-6">
                 <div className="w-12 h-12 border-4 border-marker-black border-t-transparent animate-spin rounded-full"></div>
                 <span className="handwritten text-lg text-marker-black animate-pulse uppercase tracking-widest">Reading the stones...</span>
               </div>
             )}
           </div>
        </div>

        {/* The Board (Canvas) */}
        <div className="flex-1 w-full flex items-center justify-center">
           <div className="relative p-2 md:p-4 bg-white shadow-2xl marker-border border-marker-black rotate-1 w-full max-w-[600px] aspect-square">
             <canvas 
               ref={canvasRef}
               width={600}
               height={600}
               className="w-full h-full bg-slate-100 cursor-crosshair touch-none"
               onMouseMove={handleCanvasMouseMove}
               onMouseLeave={handleCanvasLeave}
               onTouchStart={handleCanvasTouchStart}
             />
             {/* Decorative Corner Screws */}
             <div className="absolute top-4 left-4 md:top-6 md:left-6 w-2 h-2 md:w-3 md:h-3 rounded-full bg-marker-black opacity-20"></div>
             <div className="absolute top-4 right-4 md:top-6 md:right-6 w-2 h-2 md:w-3 md:h-3 rounded-full bg-marker-black opacity-20"></div>
             <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 w-2 h-2 md:w-3 md:h-3 rounded-full bg-marker-black opacity-20"></div>
             <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-2 h-2 md:w-3 md:h-3 rounded-full bg-marker-black opacity-20"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CharmCastingTool;
