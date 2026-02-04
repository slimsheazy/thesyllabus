
export interface TarotCard {
  name: string;
  arcana: 'Major' | 'Minor';
  description: string;
  image: string;
}

export interface ReadingResponse {
  interpretation: string;
  guidance: string;
}

export interface GlossaryDefinition {
  word: string;
  definition: string;
  etymology?: string;
}

export enum Page {
  HOME = 'HOME',
  HORARY = 'HORARY',
  ELECTIONAL = 'ELECTIONAL',
  NUMEROLOGY = 'NUMEROLOGY',
  LOST_ITEM_FINDER = 'LOST_ITEM_FINDER',
  ARCHIVE = 'ARCHIVE',
  SIGIL_MAKER = 'SIGIL_MAKER',
  MAD_LIBS = 'MAD_LIBS',
  FRIENDSHIP_MATRIX = 'FRIENDSHIP_MATRIX',
  BAZI = 'BAZI',
  BIO_CALC = 'BIO_CALC',
  FLYING_STAR = 'FLYING_STAR',
  PIE_DECONSTRUCTION = 'PIE_DECONSTRUCTION',
  COLOR_PALETTE = 'COLOR_PALETTE',
  BIORHYTHM = 'BIORHYTHM',
  SEMANTIC_DRIFT = 'SEMANTIC_DRIFT',
  CHARM_CASTING = 'CHARM_CASTING',
  BIRTH_CHART = 'BIRTH_CHART',
  ASTRO_MAP = 'ASTRO_MAP',
  TAROT = 'TAROT',
  DECK_SELECTOR = 'DECK_SELECTOR'
}
