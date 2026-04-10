import { NextRequest, NextResponse } from "next/server";
import type { Mode, PlaceCard, Price } from "@/lib/types";

const TBILISI = { lat: 41.7151, lng: 44.8271 };
const SEARCH_RADIUS_METERS = 8000;
const CITY_BOUNDARY = {
  north: 41.84,
  south: 41.62,
  west: 44.68,
  east: 45.02
};

const ALLOWED_TYPES_BY_MODE: Record<Mode, string[]> = {
  food: ["restaurant"],
  fun: ["tourist_attraction", "museum", "park", "cafe"]
};

const BLACKLIST = new Set(["night_club", "karaoke", "bar"]);

type GooglePlace = {
  place_id: string;
  name: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry?: { location?: { lat: number; lng: number } };
  opening_hours?: { open_now?: boolean };
  photos?: { photo_reference: string }[];
};

function insideTbilisi(lat?: number, lng?: number) {
  if (!lat || !lng) return false;
  return lat >= CITY_BOUNDARY.south && lat <= CITY_BOUNDARY.north && lng >= CITY_BOUNDARY.west && lng <= CITY_BOUNDARY.east;
}

function typeAllowed(placeTypes: string[], mode: Mode, wildcard: boolean) {
  if (placeTypes.some((t) => BLACKLIST.has(t))) return false;
  if (wildcard) return true;
  return placeTypes.some((t) => ALLOWED_TYPES_BY_MODE[mode].includes(t));
}

function formatPlace(place: GooglePlace, key: string): PlaceCard {
  const photoRef = place.photos?.[0]?.photo_reference;
  const photoUrl = photoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${key}`
    : undefined;

  return {
    id: place.place_id,
    name: place.name,
    rating: place.rating ?? 0,
    priceLevel: place.price_level,
    photoUrl,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    types: place.types,
    openNow: !!place.opening_hours?.open_now,
    hearts: 0,
    skips: 0
  };
}

export async function POST(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY is missing." }, { status: 500 });
  }

  const body = (await req.json()) as { mode?: Mode; budget?: Price; wildcard?: boolean };
  const mode: Mode = body.mode === "food" ? "food" : "fun";
  const budget: Price = body.budget ?? "any";
  const wildcard = !!body.wildcard;

  const minRating = wildcard ? 4.5 : 4.2;
  const priceClause = budget === "any" ? "" : `&minprice=${budget}&maxprice=${budget}`;

  const keyword = wildcard
    ? "hidden gem viewpoint niche museum"
    : mode === "food"
      ? "restaurant"
      : "attraction museum park chill pub";

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${TBILISI.lat},${TBILISI.lng}&radius=${SEARCH_RADIUS_METERS}&opennow=true&keyword=${encodeURIComponent(keyword)}${priceClause}&key=${key}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) {
    return NextResponse.json({ error: "Failed to query Google Places." }, { status: 502 });
  }

  const data = (await response.json()) as { results?: GooglePlace[] };
  const filtered = (data.results ?? [])
    .filter((p) => (p.rating ?? 0) >= minRating)
    .filter((p) => p.opening_hours?.open_now)
    .filter((p) => typeAllowed(p.types ?? [], mode, wildcard))
    .filter((p) => insideTbilisi(p.geometry?.location?.lat, p.geometry?.location?.lng))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 9)
    .map((p) => formatPlace(p, key));

  return NextResponse.json({ shortlist: filtered.slice(0, 3) });
}
