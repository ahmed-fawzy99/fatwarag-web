export type SourceKey = "islamweb" | "islamqa" | "binbaz" | "fawzan";

export type FatwaSource = {
  key: SourceKey;
  nameAr: string;
  nameEn: string;
  homeUrl: string;
};
