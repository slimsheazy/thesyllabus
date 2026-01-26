
import { GoogleGenAI, Type } from "@google/genai";
import { GlossaryDefinition } from "../types";

// --- Configuration ---
const MODELS = {
  FAST: 'gemini-3-flash-preview', 
  PRO: 'gemini-3-pro-preview',     
  IMAGE: 'gemini-2.5-flash-image',
  TTS: 'gemini-2.5-flash-preview-tts'
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Generic JSON Generator ---
async function generateJson<T>(model: string, prompt: string, schema: any): Promise<T | null> {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error(`Gemini Error (${model}):`, error);
    return null;
  }
}

// --- Numerology Helpers (Local Calculation) ---

const PYTHAGOREAN_MAP: Record<string, number> = {
  'a': 1, 'j': 1, 's': 1,
  'b': 2, 'k': 2, 't': 2,
  'c': 3, 'l': 3, 'u': 3,
  'd': 4, 'm': 4, 'v': 4,
  'e': 5, 'n': 5, 'w': 5,
  'f': 6, 'o': 6, 'x': 6,
  'g': 7, 'p': 7, 'y': 7,
  'h': 8, 'q': 8, 'z': 8,
  'i': 9, 'r': 9
};

const CHALDEAN_MAP: Record<string, number> = {
  'a': 1, 'i': 1, 'j': 1, 'q': 1, 'y': 1,
  'b': 2, 'k': 2, 'r': 2,
  'c': 3, 'g': 3, 'l': 3, 's': 3,
  'd': 4, 'm': 4, 't': 4,
  'e': 5, 'h': 5, 'n': 5, 'x': 5,
  'u': 6, 'v': 6, 'w': 6,
  'o': 7, 'z': 7,
  'f': 8, 'p': 8
  // Note: 9 is sacred/hidden in Chaldean and not assigned to letters
};

function reduceNumber(num: number): number {
  if (num === 11 || num === 22 || num === 33) return num;
  if (num < 10) return num;
  return reduceNumber(num.toString().split('').reduce((a, b) => a + parseInt(b), 0));
}

function calculateNumerology(name: string, birthDate: string, system: 'pythagorean' | 'chaldean') {
  const map = system === 'chaldean' ? CHALDEAN_MAP : PYTHAGOREAN_MAP;

  // Life Path (Generally consistent across systems, based on birth date)
  const dateDigits = birthDate.replace(/[^0-9]/g, '').split('').map(Number);
  const lifePath = reduceNumber(dateDigits.reduce((a, b) => a + b, 0));

  // Name Calculations
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  
  let destinySum = 0;
  let soulSum = 0;

  for (const char of cleanName) {
    const val = map[char] || 0;
    destinySum += val;
    if (['a','e','i','o','u'].includes(char)) {
       soulSum += val;
    }
  }

  // In Chaldean, compound numbers are often preserved, but for this simplified view we reduce.
  // The interpretation prompt will handle the nuance of the system.
  const destinyNumber = reduceNumber(destinySum);
  const soulUrge = reduceNumber(soulSum);

  return { lifePath, destinyNumber, soulUrge, destinySum, soulSum };
}

// --- Sigil Helper ---
function distillIntention(intention: string): string {
  // 1. To Upper, remove non-alpha
  const clean = intention.toUpperCase().replace(/[^A-Z]/g, '');
  // 2. Remove vowels (Austin Osman Spare method) and duplicates
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const uniqueConsonants = new Set();
  
  for (const char of clean) {
    if (!vowels.includes(char)) {
      uniqueConsonants.add(char);
    }
  }
  return Array.from(uniqueConsonants).join('');
}

// --- Services ---

export const getHoraryAnalysis = async (question: string, lat: number, lng: number, timestamp: string) => {
  const prompt = `
    You are a precision Swiss Ephemeris Engine and Master Horary Astrologer. 
    Cast a high-fidelity chart for the EXACT MOMENT: ${timestamp} at Latitude ${lat}, Longitude ${lng}.
    
    Technical Requirements:
    1. Calculate planetary degrees (0-359.99) with decimal precision.
    2. Identify the Ascendant and Midheaven (MC).
    3. Compute all major aspects (Conjunction, Sextile, Square, Trine, Opposition) with exact orbs.
    4. Analyze significators for: "${question}".
    
    Output in strictly validated JSON.
  `;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      chartData: {
        type: Type.OBJECT,
        properties: {
          ascendant: { type: Type.NUMBER },
          midheaven: { type: Type.NUMBER },
          planets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                degree: { type: Type.NUMBER },
                sign: { type: Type.STRING },
                isRetrograde: { type: Type.BOOLEAN }
              },
              required: ["name", "degree", "sign"]
            }
          },
          aspects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                p1: { type: Type.STRING },
                p2: { type: Type.STRING },
                type: { type: Type.STRING },
                orb: { type: Type.NUMBER }
              },
              required: ["p1", "p2", "type", "orb"]
            }
          }
        },
        required: ["ascendant", "planets", "aspects"]
      },
      judgment: { type: Type.STRING },
      technicalNotes: { type: Type.STRING },
      outcome: { type: Type.STRING }
    },
    required: ["chartData", "judgment", "technicalNotes", "outcome"]
  });
};

export const getElectionalAnalysis = async (question: string, lat: number, lng: number) => {
  const prompt = `
    You are a high-precision Electional Astrologer and Ephemeris Engine. 
    Scan the next 30 days from now (${new Date().toISOString()}) to identify the OPTIMAL temporal node for: "${question}".
    Location: Lat ${lat}, Lng ${lng}.
    Calculate exact positions and major aspects for the selected moment.
  `;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      selectedDate: { type: Type.STRING },
      chartData: {
        type: Type.OBJECT,
        properties: {
          ascendant: { type: Type.NUMBER },
          planets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                degree: { type: Type.NUMBER },
                sign: { type: Type.STRING }
              },
              required: ["name", "degree", "sign"]
            }
          },
          aspects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                p1: { type: Type.STRING },
                p2: { type: Type.STRING },
                type: { type: Type.STRING },
                orb: { type: Type.NUMBER }
              },
              required: ["p1", "p2", "type", "orb"]
            }
          }
        },
        required: ["ascendant", "planets", "aspects"]
      },
      judgment: { type: Type.STRING },
      technicalNotes: { type: Type.STRING },
      outcome: { type: Type.STRING }
    },
    required: ["selectedDate", "chartData", "judgment", "technicalNotes", "outcome"]
  });
};

export const getNumerologyAnalysis = async (name: string, birthday: string, system: 'pythagorean' | 'chaldean' = 'pythagorean') => {
  // 1. Calculate locally to ensure arithmetic accuracy
  const { lifePath, destinyNumber, soulUrge, destinySum, soulSum } = calculateNumerology(name, birthday, system);

  // 2. Ask AI for interpretation based on these calculated numbers
  const prompt = `
    Provide an esoteric numerological interpretation using the **${system.toUpperCase()}** system.
    Subject: ${name}
    Life Path: ${lifePath} (Sum of birthdate)
    Destiny Number (Expression): ${destinyNumber} (Derived from sum ${destinySum})
    Soul Urge: ${soulUrge} (Derived from sum ${soulSum})
    
    Context:
    ${system === 'chaldean' 
      ? "Use Chaldean interpretations. Pay special attention to the compound numbers (e.g. if the Destiny Sum was 23, interpret the vibration of 23/5). Chaldean numerology is more mystical and karma-oriented." 
      : "Use Modern Pythagorean interpretations. Focus on the psychological profiles and sequential growth patterns."}
    
    Provide a 'meaning' (synthesis of these numbers) and 'esotericInsight' (deeper spiritual implication).
  `;

  const interpretation = await generateJson<{ meaning: string, esotericInsight: string }>(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      meaning: { type: Type.STRING },
      esotericInsight: { type: Type.STRING }
    },
    required: ["meaning", "esotericInsight"]
  });

  return {
    lifePath,
    destinyNumber,
    soulUrge,
    meaning: interpretation?.meaning || "The numbers are silent.",
    esotericInsight: interpretation?.esotericInsight || "Vibrations unclear.",
    systemComparison: `${system.charAt(0).toUpperCase() + system.slice(1)} System`
  };
};

export const generateSigil = async (intention: string, feeling: string) => {
  try {
    const distilled = distillIntention(intention);
    // Fallback if distilled is empty
    const seed = distilled.length > 0 ? distilled : intention.toUpperCase().replace(/[^A-Z]/g, '');

    const prompt = `
      Create a single, unique, hand-drawn chaos magic sigil representing the energetic vibration of: "${feeling}".
      Base construction seed (to be abstracted): "${seed}".
      
      VISUAL STYLE:
      - Hand-drawn aesthetic with organic, flowing lines.
      - Slight imperfections and variations in line weight (thicker/thinner strokes) to simulate ink or brush on paper.
      - Natural curves rather than perfectly geometric shapes.
      - Lines that connect smoothly and gracefully, as if drawn in one continuous motion.
      - Asymmetrical elements that feel balanced but not mathematically precise.

      DESIGN ELEMENTS:
      - Incorporate flowing, calligraphic linework.
      - Use elegant curves, spirals, and organic shapes.
      - Blend geometric elements (circles, triangles) with freeform artistic flourishes.
      - Add small decorative details like dots, small crosses, or subtle embellishments.
      - Let lines intersect naturally and meaningfully.
      - Create visual focal points where energy seems to concentrate.

      OVERALL FEEL:
      - Drawn by hand with a pen or brush in a single sitting.
      - Artistic and expressive rather than technical or computer-generated.
      - Mystical and intentional, like an ancient symbol created with purpose.
      - Unique and imaginative - avoid overly simple or cliché occult symbols.
      
      TECHNICAL CONSTRAINTS:
      - Stark black lines on a pure white background.
      - High contrast.
      - **NO TEXT** or legible letters in the image. The seed must be completely abstracted into the shape.
      - No colors.
      - No shading or 3D effects, just pure line art.
    `;
    
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    // Check for inline data (Base64)
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Sigil Generation Error:", error);
    return null;
  }
};

export const getQuoteWall = async (theme: string) => {
  const prompt = `Generate 6 unique, cryptic, and powerful esoteric quotes based on the theme: "${theme}". Brutalist, academic, and mystical tone.`;
  
  const result = await generateJson<string[]>(MODELS.FAST, prompt, {
    type: Type.ARRAY,
    items: { type: Type.STRING }
  });

  return result || ["The grid is silent.", "Silence is the code.", "The void answers only in frequency."];
};

export const getWordDefinition = async (word: string) => {
  const prompt = `Define the term "${word}" in a strictly concise, technical, and academic manner (max 15 words). Focus on its standard dictionary definition in a scientific or philosophical context. Do not use esoteric or occult interpretations.`;
  
  return generateJson<GlossaryDefinition>(MODELS.FAST, prompt, {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      definition: { type: Type.STRING },
      etymology: { type: Type.STRING }
    },
    required: ["word", "definition"]
  });
};

export const getBaziAnalysis = async (date: string, time: string) => {
  const prompt = `
    Calculate the Bazi (Four Pillars of Destiny) chart for: Date ${date}, Time ${time}. 
    Ensure each pillar has a personalized 'personalExplanation' that describes its deep impact on the user's archetypal path.
  `;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      pillars: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            stem: { type: Type.STRING },
            branch: { type: Type.STRING },
            tenGod: { type: Type.STRING },
            hiddenStems: { type: Type.ARRAY, items: { type: Type.STRING } },
            personalExplanation: { type: Type.STRING }
          },
          required: ["type", "stem", "branch", "tenGod", "hiddenStems", "personalExplanation"]
        }
      },
      dayMaster: { type: Type.STRING },
      densityProfile: { type: Type.STRING },
      tenGodsAnalysis: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            vector: { type: Type.STRING },
            implication: { type: Type.STRING }
          },
          required: ["name", "vector", "implication"]
        }
      },
      thermodynamicLogic: { type: Type.STRING }
    },
    required: ["pillars", "dayMaster", "densityProfile", "tenGodsAnalysis", "thermodynamicLogic"]
  });
};

export const getBiologicalDepreciation = async (metrics: { age: number, telomereMaintenance: number, systemicLoad: number }) => {
  const prompt = `
    Actuarial analysis (Gompertz-Makeham) for Subject: Age ${metrics.age}, Telomere Maintenance Score ${metrics.telomereMaintenance}/10, Systemic Load Score ${metrics.systemicLoad}/10.
    
    Generate a response for a layperson.
    1. 'obsolescenceDate': The projected end date in MM/DD/YYYY format.
    2. 'accuracyProbability': A percentage confidence.
    3. 'actuarialReport': A simple, easy-to-understand explanation of why this date was projected based on their lifestyle (maintenance and load). Avoid complex jargon; focus on the impact of their choices.
    4. 'depreciationMetrics': A short, punchy summary of the body's condition (e.g. "Moderate Wear", "High Efficiency").
    
    IMPORTANT: Return 'obsolescenceDate' strictly in MM/DD/YYYY format.
  `;
  
  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      obsolescenceDate: { type: Type.STRING },
      accuracyProbability: { type: Type.NUMBER },
      actuarialReport: { type: Type.STRING },
      depreciationMetrics: { type: Type.STRING }
    },
    required: ["obsolescenceDate", "accuracyProbability", "actuarialReport", "depreciationMetrics"]
  });
};

export const getFlyingStarAnalysis = async (period: number, facingDegree: number) => {
  const prompt = `Perform a Xuan Kong Flying Star (Xing Kong) spatial mapping for Construction Period ${period} and Facing Direction ${facingDegree} degrees.`;
  
  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      palaces: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            direction: { type: Type.STRING },
            baseStar: { type: Type.NUMBER },
            mountainStar: { type: Type.NUMBER },
            waterStar: { type: Type.NUMBER },
            technicalStatus: { type: Type.STRING }
          },
          required: ["direction", "baseStar", "mountainStar", "waterStar", "technicalStatus"]
        }
      },
      energyFlowSummary: { type: Type.STRING },
      spatialAdjustments: { type: Type.ARRAY, items: { type: Type.STRING } },
      thermodynamicLogic: { type: Type.STRING }
    },
    required: ["palaces", "energyFlowSummary", "spatialAdjustments", "thermodynamicLogic"]
  });
};

export const getPieDeconstruction = async (word: string) => {
  const prompt = `Perform a PIE (Proto-Indo-European) etymological deconstruction for: "${word}".`;
  
  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      pieRoot: { type: Type.STRING },
      rootMeaning: { type: Type.STRING },
      semanticTrace: { type: Type.ARRAY, items: { type: Type.STRING } },
      modernConcept: { type: Type.STRING },
      esotericImplication: { type: Type.STRING }
    },
    required: ["pieRoot", "rootMeaning", "semanticTrace", "modernConcept", "esotericImplication"]
  });
};

export const getColorPalette = async (input: string, mode: 'date' | 'vibe') => {
  const prompt = `
    Analyze the 'Elemental Density' and 'Vibrational Spectrum' for: "${input}" (${mode} mode). 
    Generate an expansive 12-color design matrix. 
    Organize the palette into 3 distinct layers: 'The Root' (Foundational essence), 'The Aether' (Shadow and hidden frequencies), and 'The Flare' (Aspirational and spiritual zenith).
    Each layer must contain 4 specific hex colors.
  `;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      analysis: { type: Type.STRING },
      deficiency: { type: Type.STRING },
      colors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            hex: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            layer: { type: Type.STRING, description: "Layer type: 'Root', 'Aether', or 'Flare'" }
          },
          required: ["name", "hex", "reasoning", "layer"]
        }
      },
      technicalSynthesis: { type: Type.STRING }
    },
    required: ["analysis", "deficiency", "colors", "technicalSynthesis"]
  });
};

export const getTarotReading = async (cards: {name: string, isReversed: boolean}[], question: string) => {
  const prompt = `Perform a professional tarot reading for: "${question}". Cards: ${cards.map(c => `${c.name} (${c.isReversed ? 'Reversed' : 'Upright'})`).join(', ')}.`;
  
  const result = await generateJson<{interpretation: string, guidance: string}>(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      interpretation: { type: Type.STRING },
      guidance: { type: Type.STRING }
    },
    required: ["interpretation", "guidance"]
  });

  return result || { interpretation: "Archetypes obscured.", guidance: "Seek clarity later." };
};

export const generateCosmicMadLib = async (inputs: { noun: string, verb: string, adjective: string, object: string, place: string }) => {
  const prompt = `Create a 'Cosmic Mad-Lib' ritual workshop with these: Noun: ${inputs.noun}, Verb: ${inputs.verb}, Adjective: ${inputs.adjective}, Object: ${inputs.object}, Place: ${inputs.place}.`;
  
  return generateJson(MODELS.FAST, prompt, {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      revelation: { type: Type.STRING }
    },
    required: ["title", "steps", "revelation"]
  });
};

export const getFriendshipMatrix = async (subject1: string, subject2: string) => {
  const prompt = `Vibrational synastry for Subject Alpha: "${subject1}" and Subject Beta: "${subject2}".`;
  
  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      compatibilityScore: { type: Type.NUMBER },
      vibrationalMatch: { type: Type.STRING },
      analysis: { type: Type.STRING }
    },
    required: ["compatibilityScore", "vibrationalMatch", "analysis"]
  });
};

export const getBiorhythmInterpretation = async (metrics: { physical: number, emotional: number, intellectual: number }) => {
  const prompt = `
    Interpret these Biorhythm levels for a student of the occult:
    Physical: ${metrics.physical}% (Capacity for ritual endurance)
    Emotional: ${metrics.emotional}% (Capacity for intuitive resonance)
    Intellectual: ${metrics.intellectual}% (Capacity for hermetic study)

    Provide a short, esoteric 'Capacity Brief' for today. 
    If Intellectual is high (>50%), suggest a specific study topic from the syllabus.
    If Emotional is critical (near 0% or crossing 0), suggest a specific grounding technique.
  `;

  return generateJson<{ brief: string, suggestion: string }>(MODELS.FAST, prompt, {
    type: Type.OBJECT,
    properties: {
      brief: { type: Type.STRING },
      suggestion: { type: Type.STRING }
    },
    required: ["brief", "suggestion"]
  });
};

export const generateSemanticQuiz = async () => {
  const prompt = `
    Generate 5 challenging multiple-choice questions focusing on "Semantic Drift" and Etymology.
    Target words where meanings have shifted drastically over time (e.g., 'Nice' originally meant foolish, 'Awful' meant full of awe).
    
    Format as JSON array of objects.
  `;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING },
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctIndex: { type: Type.NUMBER },
        explanation: { type: Type.STRING }
      },
      required: ["word", "question", "options", "correctIndex", "explanation"]
    }
  });
};

export const getCharmReading = async (charms: { name: string, zone: string }[], intent: string) => {
  const prompt = `
    Act as an expert Charm Caster (Osteomancy/Lithomancy).
    User Intent: "${intent}".
    
    The charms landed in the following configuration on the 12-House Casting Board:
    ${charms.map(c => `- The '${c.name}' charm landed in '${c.zone}'.`).join('\n')}
    
    Board Sectors (Astrological Houses):
    - House I: Self, Identity, Appearance.
    - House II: Values, Possessions, Resources.
    - House III: Communication, Siblings, Short Trips.
    - House IV: Home, Roots, Family.
    - House V: Creativity, Pleasure, Romance.
    - House VI: Health, Routine, Service.
    - House VII: Partnership, Marriage, Open Enemies.
    - House VIII: Transformation, Death, Shared Resources.
    - House IX: Philosophy, Travel, Higher Mind.
    - House X: Career, Public Standing, Authority.
    - House XI: Community, Friends, Hopes.
    - House XII: Subconscious, Hidden Things, Karma.
    - THE VOID (Center): Pure potential, chaos, or lack of focus.
    
    Synthesize these positions into a coherent reading.
  `;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      synthesis: { type: Type.STRING },
      keyInsight: { type: Type.STRING },
      charmDetails: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            charm: { type: Type.STRING },
            meaning: { type: Type.STRING }
          },
          required: ["charm", "meaning"]
        }
      }
    },
    required: ["synthesis", "keyInsight", "charmDetails"]
  });
};

export const generateSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Generate Speech Error:", error);
    return null;
  }
};

export const getBirthChartAnalysis = async (input: { 
  date: string, 
  time: string, 
  lat: number, 
  lng: number, 
  settings: Record<string, any> 
}) => {
  const prompt = `
    You are the Birth Chart Engine for an astrology application.
    Your job is to compute and interpret natal charts with precision, consistency, and zero generic filler.

    CORE RULES:
    1. Never guess missing data. If birth date, time, or location is incomplete, request clarification.
    2. All calculations and interpretations must follow the settings provided by the user or the app.
    3. Never provide generic, vague, or personality-based interpretations. All interpretations must be:
       - Specific to the chart
       - Based on actual placements
       - Rooted in traditional or modern astrology depending on settings
    4. Never invent planets, aspects, or house placements that were not provided or calculated.

    HOUSE SYSTEM & NUMBERING RULES:
    1. The chart contains 12 houses.
    2. House numbering ALWAYS begins at the Ascendant.
    3. House numbers increase COUNTERCLOCKWISE around the wheel.
    4. House 1 = the sign on the Ascendant.
    5. House 2 = the next sign counterclockwise.
    6. House 3 = the next sign counterclockwise, and so on.
    7. House 12 is the final house before returning to House 1.
    8. Houses are fixed and NEVER renumbered based on planets.
    9. Use the house system specified in settings: ${input.settings.houseSystem || 'Placidus'}
    10. Never switch systems unless explicitly told.

    PLANETARY RULES:
    1. Use the planetary positions calculated for: Date ${input.date}, Time ${input.time}, Lat ${input.lat}, Lng ${input.lng}.
    2. Do not alter or approximate planetary degrees.
    3. Include: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Lunar Nodes (True).
    4. Retrograde status must be preserved exactly as calculated.

    ASPECT RULES:
    1. Use only the aspects enabled in settings: Conjunction, Sextile, Square, Trine, Opposition.
    2. Use standard orbs (Conjunction: 8, Opposition: 8, Trine: 8, Square: 7, Sextile: 5).

    INTERPRETATION RULES:
    1. Interpret ONLY what is present in the chart.
    2. Interpretations must be technical and non-generic.
    3. Avoid clichés. Describe function, sign expression, house context, and aspect dynamics.

    INPUT DATA:
    Date: ${input.date}
    Time: ${input.time}
    Location: ${input.lat}, ${input.lng}
    Settings: ${JSON.stringify(input.settings)}

    OUTPUT FORMAT:
    Return valid JSON matching the schema strictly.
  `;

  return generateJson(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      chart_metadata: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          time: { type: Type.STRING },
          location: { type: Type.STRING },
          house_system: { type: Type.STRING },
          timezone: { type: Type.STRING },
          settings_used: { type: Type.OBJECT, properties: {}, additionalProperties: true }
        },
        required: ["date", "time", "location", "house_system"]
      },
      ascendant: {
        type: Type.OBJECT,
        properties: {
          sign: { type: Type.STRING },
          degree: { type: Type.NUMBER }
        },
        required: ["sign", "degree"]
      },
      houses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            house: { type: Type.NUMBER },
            sign: { type: Type.STRING },
            degree: { type: Type.NUMBER }
          },
          required: ["house", "sign", "degree"]
        }
      },
      planets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            planet: { type: Type.STRING },
            sign: { type: Type.STRING },
            degree: { type: Type.NUMBER },
            house: { type: Type.NUMBER },
            retrograde: { type: Type.BOOLEAN }
          },
          required: ["planet", "sign", "degree", "house", "retrograde"]
        }
      },
      aspects: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            planet1: { type: Type.STRING },
            planet2: { type: Type.STRING },
            aspect: { type: Type.STRING },
            orb: { type: Type.NUMBER }
          },
          required: ["planet1", "planet2", "aspect", "orb"]
        }
      },
      interpretation: {
        type: Type.OBJECT,
        properties: {
          overall_chart_theme: { type: Type.STRING },
          planetary_themes: { 
             type: Type.OBJECT,
             properties: {
               sun: { type: Type.STRING },
               moon: { type: Type.STRING },
               ascendant: { type: Type.STRING }
             },
             additionalProperties: true
          },
          house_themes: { type: Type.OBJECT, additionalProperties: true },
          aspect_themes: { type: Type.OBJECT, additionalProperties: true },
          final_synthesis: { type: Type.STRING }
        },
        required: ["overall_chart_theme", "planetary_themes", "final_synthesis"]
      }
    },
    required: ["chart_metadata", "ascendant", "houses", "planets", "aspects", "interpretation"]
  });
};

export const getRelocationAnalysis = async (birthDate: string, birthTime: string, lat: number, lng: number) => {
  const prompt = `
    You are an expert Astrocartographer.
    Calculate the **Relocation Chart** for a person born on ${birthDate} at ${birthTime} (UTC assumed for simplicity) if they were to live at Latitude ${lat}, Longitude ${lng}.
    
    Specific Tasks:
    1. Identify which planets (if any) move to the 4 Angular Cusps (Ascendant, Descendant, MC, IC) within a 10° orb at this new location.
    2. If no planets are strictly angular, identify the strongest planetary influence based on house placement (e.g., Sun in 10th, Jupiter in 1st).
    3. Provide a 'vibeCheck' describing the feeling of living in this city.
    4. Provide specific 'themes' for this location (e.g., "Career Peak", "Romance", "Solitude").

    Return strictly valid JSON.
  `;

  return generateJson<{
    angles: { planet: string, angle: string, orb: number }[],
    dominantInfluence: string,
    vibeCheck: string,
    themes: string[]
  }>(MODELS.PRO, prompt, {
    type: Type.OBJECT,
    properties: {
      angles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            planet: { type: Type.STRING },
            angle: { type: Type.STRING, description: "ASC, DSC, MC, or IC" },
            orb: { type: Type.NUMBER }
          },
          required: ["planet", "angle", "orb"]
        }
      },
      dominantInfluence: { type: Type.STRING },
      vibeCheck: { type: Type.STRING },
      themes: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["angles", "dominantInfluence", "vibeCheck", "themes"]
  });
};
