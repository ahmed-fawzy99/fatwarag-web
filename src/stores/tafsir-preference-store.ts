import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_TAFSIR } from "@/lib/config/constants";
import type { TafsirKey } from "@/types/foundations";

type TafsirPreferenceState = {
  tafsir: TafsirKey;
  setTafsir: (tafsir: TafsirKey) => void;
};

/** The reader's chosen tafsir, remembered for the visit (browser session only). */
export const useTafsirPreferenceStore = create<TafsirPreferenceState>()(
  persist(
    (set) => ({
      tafsir: DEFAULT_TAFSIR,
      setTafsir: (tafsir) => set({ tafsir }),
    }),
    { name: "tafsir-preference", storage: createJSONStorage(() => sessionStorage) },
  ),
);
