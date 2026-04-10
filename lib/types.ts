export type Mode = "food" | "fun";

export type Price = "any" | "1" | "2" | "3" | "4";

export type PlaceCard = {
  id: string;
  name: string;
  rating: number;
  priceLevel?: number;
  photoUrl?: string;
  mapsUrl: string;
  types: string[];
  openNow: boolean;
  hearts: number;
  skips: number;
};

export type SessionState = {
  id: string;
  createdAt: string;
  mode: Mode;
  budget: Price;
  wildcard: boolean;
  shortlist: PlaceCard[];
};
