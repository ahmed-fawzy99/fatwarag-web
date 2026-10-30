import { create } from "zustand";

type OpenFatwasState = {
  openIds: string[];
  /** The list whose default-open fatwa has been taken over by the reader's own choices (keyed by that fatwa's id). */
  seededFor: string | null;
  /** Replaces the open set after the reader toggles a fatwa; the default-open one then follows their choice. */
  setOpenIds: (ids: string[], seededFor?: string | null) => void;
  /** Opens a fatwa (e.g. from a citation chip) without closing the others. */
  open: (id: string) => void;
};

/** Which fatwa accordions are expanded on the answer page; shared by citation chips and the list. */
export const useOpenFatwasStore = create<OpenFatwasState>()((set) => ({
  openIds: [],
  seededFor: null,
  setOpenIds: (ids, seededFor = null) => set((state) => ({ openIds: ids, seededFor: seededFor ?? state.seededFor })),
  open: (id) => set((state) => (state.openIds.includes(id) ? state : { openIds: [...state.openIds, id] })),
}));
