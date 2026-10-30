export type Topic = {
  key: string;
  labelAr: string;
  labelEn: string | null;
  /** Fatwas filed under this topic and its descendants. */
  fatwaCount: number;
  children: Topic[];
};
