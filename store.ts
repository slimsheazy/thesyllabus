
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyllabusState {
  calculationsRun: number;
  lastAccess: string;
  isEclipseMode: boolean;
  userLocation: { lat: number; lng: number } | null;
  recordCalculation: () => void;
  updateLastAccess: () => void;
  toggleEclipseMode: () => void;
  setUserLocation: (loc: { lat: number; lng: number }) => void;
}

export const useSyllabusStore = create<SyllabusState>()(
  persist(
    (set) => ({
      calculationsRun: 0,
      lastAccess: new Date().toISOString(),
      isEclipseMode: false,
      userLocation: null,
      recordCalculation: () => set((state) => ({ 
        calculationsRun: state.calculationsRun + 1 
      })),
      updateLastAccess: () => set({ lastAccess: new Date().toISOString() }),
      toggleEclipseMode: () => set((state) => ({ isEclipseMode: !state.isEclipseMode })),
      setUserLocation: (loc) => set({ userLocation: loc }),
    }),
    {
      name: 'the-syllabus-state',
    }
  )
);
