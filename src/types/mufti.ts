export type Mufti = {
  key: string;
  nameAr: string;
  nameEn: string;
  kind: "institution" | "scholar";
  /** Verbatim from the source's own pages; never AI-written. */
  bioAr: string | null;
  bioEn: string | null;
  bioSourceUrl: string | null;
};
