
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
  
  const [hoveredCharm, setHoveredCharm] = useState<{name: string, meaning: string, x: number, y: number} | null>(null);
  
  // Physics State Refs (Mutable for animation loop)
  const charmsRef = useRef<PhysicsCharm[]>([]);
  const animationRef = useRef<number>(0);
  const { recordCalculation } = useSyllabusStore();
  // removed useGlossary hooks

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
    const dy = y - cy; // Y grows downward in canvas, but standard cartesian Y grows upward.
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Center Void (Radius 10% of width)
    if (dist < width * 0.1) return "THE VOID (Center)";
    // Out of bounds (Radius 45% of width)
    if (dist > width * 0.48) return "THE ETHER (Out of Bounds)"; 

    // Calculate angle in degrees
    // Canvas: 0 is 3 o'clock, 90 is 6 o'clock (down), 180 is 9 o'clock, 270 is 12 o'clock (up)
    // Astrological: House 1 starts at Ascendant (9 o'clock / 180°) and goes Counter-Clockwise (Down).
    // So 180° -> 90° is House 1? No, 180 (9pm) to 210 is usually House 1?
    // Let's standardize:
    // ASC (9 o'clock) is the Cusp of House 1.
    // House 1 is 9 o'clock to 8 o'clock.
    // House 2 is 8 o'clock to 7 o'clock.
    
    // Let's use Math.atan2(dy, dx).
    // result is -PI to PI.
    // 3 o'clock = 0
    // 6 o'clock = PI/2 (90 deg)
    // 9 o'clock = PI (180 deg)
    // 12 o'clock = -PI/2 (-90 deg)
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // Normalize to 0-360 starting at 3 o'clock going clockwise (Canvas standard)
    if (angle < 0) angle += 360;
    
    // We want House 1 to start at 180 (9 o'clock) and go clockwise in this coordinate system (which corresponds to "down" on the screen).
    // Wait, astrology is Counter-Clockwise?
    // Standard: Ascendant is East (Left). House 1 is "below" the horizon. 
    // So House 1 is 9 o'clock to 8 o'clock? That's visually "down".
    // 9 o'clock is 180 deg. 6 o'clock is 90 deg.
    // So House 1 spans 180 -> 90? No.
    // Let's shift so 9 o'clock (180) is 0.
    
    // Let's map degrees to Houses manually to be safe.
    // 0-30: House 7 (Descendant is 3 o'clock, going down/right? No, House 7 is usually 3-2 o'clock)
    
    // Simplified Visual Map for "The Syllabus" (Counter-Clockwise from 9 o'clock):
    // 9-8 (180-150?): H1
    // 8-7: H2
    // ...
    
    // Let's just rotate our angle so 0 is 9 o'clock (180 in canvas).
    // And flip direction?
    
    // Easy way: 
    // House 1: 150° - 180° (Just below horizon on left) -> Canvas 180 is Left. Canvas 90 is Bottom.
    // So H1 is 180 to 90 quadrant?
    // 12 Houses = 30 degrees each.
    
    // Correct mapping for Canvas coordinates (Y down):
    // H1: 180° to 150° (Left to Lower-Left) ?? No, 180 is left. 90 is bottom.
    // Let's assume equal houses.
    // H1: 150-180 (if 180 is AC)
    // Let's just define sectors based on Canvas Angle (0=Right, 90=Down, 180=Left, 270=Up)
    
    // House 1 (Identity): Left, going down. (180 -> 150) ? No, angle goes 180 -> 90.
    // Let's shift angle so 180 (Left) becomes 0.
    // Canvas: 180.
    // Target: 0.
    // Shift: -180.
    // H1: 0 to 30.
    
    let chartAngle = angle - 180;
    if (chartAngle < 0) chartAngle += 360;
    // Now 0 is Left (9 o'clock).
    // 90 is Top (12 o'clock) -> -90 (270) in canvas was up. 180+90 = 270. So 90 is Up.
    // 270 is Bottom (6 o'clock).
    
    // Standard Astrology Order (CCW from Ascendant):
    // H1: 0-30 (Left to Below-Left)
    // H2: 30-60
    // H3: 60-90 (Nadir / IC)
    // ...
    // Wait, in Canvas (Y down), going "down" from Left increases angle?
    // At 180 (Left), increasing angle goes to 270 (Top)?? No.
    // 180 is Left. 270 is Top.
    // 180 -> 270 is "Up".
    // 180 -> 90 is "Down"? No, 90 is bottom.
    // Canvas: 0 (Right), 90 (Bottom), 180 (Left), 270 (Top).
    
    // So going "Counter-Clockwise" on a chart (Left -> Down -> Right -> Up):
    // 180 (Left) -> 90 (Bottom). (Angle DECREASES in Canvas logic?)
    // Yes.
    
    // Let's define the angle from the Left (180), going "down" (towards 90).
    // Left = 180.
    // Down = 90.
    // Right = 0 / 360.
    // Up = 270.
    
    // We want a value 0-360 starting at 180 and moving towards 90.
    // 180 -> 90 (Diff -90).
    // Let's simply invert the canvas angle logic or map ranges.
    
    let house = 0;
    
    if (angle >= 150 && angle < 180) house = 1;       // H1: Just below horizon (Left)
    else if (angle >= 120 && angle < 150) house = 2;
    else if (angle >= 90 && angle < 120) house = 3;   // H3: Bottom-Left
    else if (angle >= 60 && angle < 90) house = 4;    // H4: Bottom-Right (IC)
    else if (angle >= 30 && angle < 60) house = 5;
    else if (angle >= 0 && angle < 30) house = 6;
    else if (angle >= 330 && angle < 360) house = 7;  // H7: Descendant (Right)
    else if (angle >= 300 && angle < 330) house = 8;
    else if (angle >= 270 && angle < 300) house = 9;
    else if (angle >= 240 && angle < 270) house = 10; // H10: Midheaven (Top)
    else if (angle >= 210 && angle < 240) house = 11;
    else if (angle >= 180 && angle < 210) house = 12; // H12: Just above horizon (Left)
    
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
    
    return HOUSES[house - 1] || "Unknown Sector";
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

    let hit = false;
    for (let i = charmsRef.current.length - 1; i >= 0; i--) {
      const c = charmsRef.current[i];
      const dx = x - c.x;
      const dy = y - c.y;
      const r = 25 * c.scale; 
      
      if (dx * dx + dy * dy < r * r) {
        const def = CHARMS.find(ch => ch.id === c.id);
        const detail = reading?.charmDetails?.find((d: any) => d.charm === def?.name);
        
        if (def) {
          // Adjust tooltip position to be relative to the viewport
          setHoveredCharm({
            name: def.name,
            meaning: detail?.meaning || "Meaning obscured...",
            x: clientX,
            y: clientY - 40 // Offset above finger/cursor
          });
          hit = true;
        }
        break;
      }
    }

    if (!hit) {
      setHoveredCharm(null);
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
    setHoveredCharm(null);
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
             <p className="handwritten text-lg text-marker-black opacity-60"><GlossaryTerm word="Lithomancy">Lithomancy</GlossaryTerm> Board</p>
           </header>
           
           <div className="space-y-8">
             <div className="space-y-2">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2 uppercase tracking-widest">Focus your <GlossaryTerm word="Intention">Intent</GlossaryTerm></label>
               <input 
                 value={intent}
                 onChange={(e) => setIntent(e.target.value)}
                 placeholder="What do you seek?"
                 className="w-full p-8 text-marker-black text-2xl shadow-sm italic placeholder:opacity-30 border-marker-black/20 focus:border-marker-black/40 bg-white/50"
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
             {/* Hover Tooltip */}
             {hoveredCharm && (
               <div 
                 className="fixed z-[9999] pointer-events-none bg-white border border-marker-black shadow-2xl p-4 rounded-lg max-w-xs animate-in zoom-in-95 duration-200"
                 style={{ 
                   left: hoveredCharm.x, 
                   top: hoveredCharm.y,
                   transform: 'translate(-50%, -100%)'
                 }}
               >
                 <div className="handwritten text-xs font-bold uppercase text-marker-blue mb-1 tracking-widest">{hoveredCharm.name}</div>
                 <div className="handwritten text-sm text-marker-black italic leading-snug">{hoveredCharm.meaning}</div>
                 {/* Little triangle arrow */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-r border-b border-marker-black rotate-45"></div>
               </div>
             )}
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
