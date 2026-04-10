"use client";

import { useEffect, useMemo, useState } from "react";
import type { Mode, PlaceCard, Price, SessionState } from "@/lib/types";

const budgetOptions: { label: string; value: Price }[] = [
  { label: "Any", value: "any" },
  { label: "$", value: "1" },
  { label: "$$", value: "2" },
  { label: "$$$", value: "3" },
  { label: "$$$$", value: "4" }
];

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("food");
  const [budget, setBudget] = useState<Price>("any");
  const [dark, setDark] = useState(false);
  const [wildcard, setWildcard] = useState(false);
  const [shortlist, setShortlist] = useState<PlaceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session");
    if (!id) return;
    setSession(id);
    fetch(`/api/session/${id}`)
      .then((res) => res.json())
      .then((payload: { session?: SessionState; error?: string }) => {
        if (payload.session) {
          setShortlist(payload.session.shortlist);
          setMode(payload.session.mode);
          setBudget(payload.session.budget);
          setWildcard(payload.session.wildcard);
        } else if (payload.error) {
          setError(payload.error);
        }
      });
  }, []);

  const sessionLink = useMemo(() => {
    if (!session || typeof window === "undefined") return "";
    return `${window.location.origin}?session=${session}`;
  }, [session]);

  async function generateShortlist(forceWildcard = wildcard) {
    setLoading(true);
    setError(null);
    try {
      const placesRes = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, budget, wildcard: forceWildcard })
      });
      const placesPayload = await placesRes.json();
      if (!placesRes.ok) throw new Error(placesPayload.error || "Failed to load places");

      const picks: PlaceCard[] = placesPayload.shortlist || [];
      setShortlist(picks);

      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, budget, wildcard: forceWildcard, shortlist: picks })
      });
      const sessionPayload = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionPayload.error || "Failed to create session");

      setSession(sessionPayload.session.id);
      window.history.replaceState({}, "", `?session=${sessionPayload.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function vote(placeId: string, value: "heart" | "x") {
    if (!session) return;
    const res = await fetch(`/api/session/${session}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, vote: value })
    });
    const payload = await res.json();
    if (payload.session) {
      setShortlist(payload.session.shortlist);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-14 sm:p-6">
      <header className="mb-4 flex items-center justify-between rounded-2xl bg-white/80 p-4 shadow dark:bg-slate-900/90">
        <div>
          <h1 className="text-xl font-bold">Tbilisi Weekend Picker</h1>
          <p className="text-sm opacity-75">Rustaveli-ready, group-friendly decisions in seconds.</p>
        </div>
        <button onClick={() => setDark((v) => !v)} className="rounded-xl border px-3 py-2 text-sm">
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow dark:bg-slate-900">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setMode("food");
              setWildcard(false);
            }}
            className={`rounded-xl px-4 py-3 font-semibold ${mode === "food" && !wildcard ? "bg-wine text-white" : "bg-slate-200 dark:bg-slate-800"}`}
          >
            Food
          </button>
          <button
            onClick={() => {
              setMode("fun");
              setWildcard(false);
            }}
            className={`rounded-xl px-4 py-3 font-semibold ${mode === "fun" && !wildcard ? "bg-wine text-white" : "bg-slate-200 dark:bg-slate-800"}`}
          >
            Fun
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {budgetOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBudget(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm ${budget === opt.value ? "bg-sulfur text-slate-900" : "bg-slate-200 dark:bg-slate-800"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={() => {
              setWildcard(false);
              generateShortlist(false);
            }}
            disabled={loading}
            className="rounded-2xl bg-wine px-5 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            Decide For Us
          </button>
          <button
            onClick={() => {
              setWildcard(true);
              generateShortlist(true);
            }}
            disabled={loading}
            className="rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            Wildcard Hidden Gem (4.5+)
          </button>
        </div>
      </section>

      {sessionLink && (
        <p className="mb-3 break-all rounded-xl bg-emerald-100 p-3 text-sm dark:bg-emerald-950/60">
          Share link: <a className="underline" href={sessionLink}>{sessionLink}</a>
        </p>
      )}

      {error && <p className="mb-3 rounded-xl bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <section className="space-y-3">
        {shortlist.map((place) => (
          <article key={place.id} className="rounded-2xl bg-white p-3 shadow dark:bg-slate-900">
            {place.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={place.photoUrl} alt={place.name} className="mb-2 h-44 w-full rounded-xl object-cover" />
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{place.name}</h2>
                <p className="text-sm opacity-80">⭐ {place.rating.toFixed(1)} · {"$".repeat(place.priceLevel ?? 0) || "Price N/A"}</p>
              </div>
              <a className="rounded-lg border px-2 py-1 text-xs" href={place.mapsUrl} target="_blank">
                Open in Google Maps
              </a>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => vote(place.id, "heart")} className="rounded-xl bg-pink-600 px-3 py-2 text-white">❤️ {place.hearts}</button>
              <button onClick={() => vote(place.id, "x")} className="rounded-xl bg-slate-700 px-3 py-2 text-white">✖ {place.skips}</button>
            </div>
          </article>
        ))}
      </section>

      {!!shortlist.length && (
        <button onClick={() => generateShortlist(wildcard)} className="mt-4 w-full rounded-2xl border-2 border-dashed px-4 py-3 font-semibold">
          Shuffle Shortlist
        </button>
      )}
    </main>
  );
}
