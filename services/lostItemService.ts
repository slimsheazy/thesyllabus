
// Pythagorean Letter Map
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

// Chaldean Letter Map (No 9s assigned to letters)
const CHALDEAN_MAP: Record<string, number> = {
  'a': 1, 'i': 1, 'j': 1, 'q': 1, 'y': 1,
  'b': 2, 'k': 2, 'r': 2,
  'c': 3, 'g': 3, 'l': 3, 's': 3,
  'd': 4, 'm': 4, 't': 4,
  'e': 5, 'h': 5, 'n': 5, 'x': 5,
  'u': 6, 'v': 6, 'w': 6,
  'o': 7, 'z': 7,
  'f': 8, 'p': 8
};

// --- Interpretations Database ---

interface NumberInterpretation {
  direction: string;
  angle: number; // Degrees for compass (0 = North, 90 = East)
  keywords: string[];
  roomType: string;
  height: string;
  containers: string;
  materials: string;
  specificSpots: string[];
  timing: string;
  clues: string;
  icon: string;
}

const INTERPRETATIONS: Record<number, NumberInterpretation> = {
  1: {
    direction: "East (Front)",
    angle: 90,
    keywords: ["New Beginnings", "Front", "Identity"],
    roomType: "Entryway, Front Rooms, Porch",
    height: "Eye Level / On Top",
    containers: "Obvious spots, near door, hooks",
    materials: "Metal, Electronics, New items",
    specificSpots: ["Coat hooks", "Dresser top", "Car front seat", "Kitchen counter", "Front door table", "Bathroom sink"],
    timing: "Sunrise / Morning",
    clues: "Look in the FIRST place you used it. It is likely near the front of the house or room.",
    icon: "🌅"
  },
  2: {
    direction: "North (Pairs)",
    angle: 0,
    keywords: ["Duality", "Comfort", "Water"],
    roomType: "Bedroom, Bathroom, Laundry",
    height: "Low to Middle",
    containers: "Drawers, Pairs (Shoeboxes), Soft containers",
    materials: "Fabrics, Cushions, Water/Reflective surfaces",
    specificSpots: ["Between cushions", "Bedside table", "Under bed", "Laundry basket", "Near partner's items", "Inside a pocket"],
    timing: "Evening / Night",
    clues: "It is hidden in something soft or paired. Check anywhere you sit for comfort.",
    icon: "🌙"
  },
  3: {
    direction: "Northeast (Social)",
    angle: 45,
    keywords: ["Communication", "Creativity", "Triangles"],
    roomType: "Living Room, Playroom, Study",
    height: "Middle (Table height)",
    containers: "Shelves, With books/papers, Stacks",
    materials: "Paper, Art supplies, Tech devices",
    specificSpots: ["Coffee table", "Bookshelf", "Near TV/Remote", "Desk", "Craft area", "Magazine rack"],
    timing: "Afternoon",
    clues: "It is where you communicate or relax. It may be sandwiched between other items (books, papers).",
    icon: "📐"
  },
  4: {
    direction: "West (Structure)",
    angle: 270,
    keywords: ["Stability", "Order", "Corners"],
    roomType: "Office, Garage, Storage",
    height: "Low / In Drawers",
    containers: "Boxes, Filing cabinets, Locked places",
    materials: "Wood, Earth, Stone, Heavy furniture",
    specificSpots: ["Desk drawer", "Filing cabinet", "Room corners", "Toolbox", "Under heavy furniture", "Safe"],
    timing: "Late Afternoon",
    clues: "It is inside something secure or structural. Check corners and organizational systems.",
    icon: "🔲"
  },
  5: {
    direction: "Center (Motion)",
    angle: -1, // Special case for center
    keywords: ["Change", "Scatter", "Transition"],
    roomType: "Hallways, Corridors, Car",
    height: "Scattered (High and Low)",
    containers: "Junk drawers, Bags, Pockets",
    materials: "Mixed materials, Plastic, Glass",
    specificSpots: ["Kitchen island", "Hallway table", "Car console", "Handbag/Backpack", "Junk drawer", "Stairs"],
    timing: "Midday / Rushed hours",
    clues: "You were likely distracted when you lost it. Check transition areas or 'dumping grounds' for items.",
    icon: "🌪️"
  },
  6: {
    direction: "Northwest (Service)",
    angle: 315,
    keywords: ["Home", "Nurture", "Family"],
    roomType: "Kitchen, Dining Room, Pet areas",
    height: "Waist height (Counters)",
    containers: "Bowls, Baskets, Comfortable spots",
    materials: "Copper, Ceramic, Food-related",
    specificSpots: ["Dining table", "Pantry", "Near stove", "Pet bed", "Sofa", "Grocery bags"],
    timing: "Meal times",
    clues: "It is in the heart of the home. Check where the family gathers or where food is prepared.",
    icon: "🏠"
  },
  7: {
    direction: "South (Hidden)",
    angle: 180,
    keywords: ["Secrets", "Privacy", "Reflection"],
    roomType: "Bathroom, Closet, Private Den",
    height: "High (Top shelves) or Hidden",
    containers: "Behind things, Robes, Cabinets",
    materials: "Glass, Mirror, Silver, Water",
    specificSpots: ["Top shelf", "Medicine cabinet", "Behind mirror", "In a robe pocket", "Under a tub", "Private drawer"],
    timing: "Quiet hours / Early Morning",
    clues: "It is hidden from view. Look near water or reflective surfaces. It wants to be found in silence.",
    icon: "🕯️"
  },
  8: {
    direction: "Southeast (Power)",
    angle: 135,
    keywords: ["Value", "Business", "Organization"],
    roomType: "Office, Master Closet, Safe",
    height: "Organized / Systematic",
    containers: "Wallets, Briefcases, Expensive containers",
    materials: "Leather, Gold, Durable materials",
    specificSpots: ["With money/wallet", "Laptop bag", "Planner", "Office organizer", "Coat check", "Valuables box"],
    timing: "Business hours",
    clues: "It is near other valuable things. Think about where you keep money or work documents.",
    icon: "💼"
  },
  9: {
    direction: "Southwest (Endings)",
    angle: 225,
    keywords: ["Completion", "Storage", "Past"],
    roomType: "Basement, Garage, Back porch",
    height: "Low / Floor",
    containers: "Recycling bins, Old boxes, Trash",
    materials: "Old items, Dust, Discarded things",
    specificSpots: ["Recycling bin", "Laundry hamper (dirty)", "Car trunk", "Back of closet", "Storage unit", "Lost & Found"],
    timing: "End of day",
    clues: "It may have been accidentally discarded. Check places associated with 'finishing' or 'leaving'.",
    icon: "🏁"
  }
};

// --- Logic Helpers ---

const fadicReduce = (num: number): number => {
  if (num === 0) return 0;
  if (num % 9 === 0) return 9;
  return num % 9;
};

const stringToNumber = (str: string, map: Record<string, number>): number => {
  const clean = str.toLowerCase().replace(/[^a-z]/g, '');
  let sum = 0;
  for (const char of clean) {
    sum += map[char] || 0;
  }
  return fadicReduce(sum);
};

const dateToNumber = (dateString: string): number => {
  // input: "YYYY-MM-DD"
  const digits = dateString.replace(/[^0-9]/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return fadicReduce(sum);
};

// --- Main Calculator ---

export interface CalculationResult {
  itemNumber: number;
  dateNumber: number;
  seekerNumber: number;
  masterNumber: number;
  interpretation: NumberInterpretation;
  breakdown: {
    itemSum: number;
    dateSum: number;
    seekerSum: number;
    totalSum: number;
  }
}

export const calculateLostItem = (
  itemName: string,
  dateLost: string,
  seekerName: string,
  system: 'pythagorean' | 'chaldean' = 'pythagorean'
): CalculationResult => {
  const map = system === 'chaldean' ? CHALDEAN_MAP : PYTHAGOREAN_MAP;

  const itemNumber = stringToNumber(itemName, map);
  const dateNumber = dateToNumber(dateLost);
  const seekerNumber = seekerName ? stringToNumber(seekerName, map) : 0;

  // Simple sum for breakdown display (before reduction)
  // Note: This is an approximation for display, real fadic math is recursive
  const masterRaw = itemNumber + dateNumber + seekerNumber;
  const masterNumber = fadicReduce(masterRaw);

  return {
    itemNumber,
    dateNumber,
    seekerNumber,
    masterNumber,
    interpretation: INTERPRETATIONS[masterNumber],
    breakdown: {
      itemSum: itemNumber,
      dateSum: dateNumber,
      seekerSum: seekerNumber,
      totalSum: masterRaw
    }
  };
};
