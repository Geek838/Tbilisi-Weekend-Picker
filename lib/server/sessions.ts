import crypto from "node:crypto";
import type { SessionState } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __sessions: Map<string, SessionState> | undefined;
}

const store = global.__sessions ?? new Map<string, SessionState>();
global.__sessions = store;

export function createSession(payload: Omit<SessionState, "id" | "createdAt">): SessionState {
  const id = crypto.randomUUID().slice(0, 8);
  const session: SessionState = {
    ...payload,
    id,
    createdAt: new Date().toISOString()
  };
  store.set(id, session);
  return session;
}

export function getSession(id: string) {
  return store.get(id);
}

export function updateVote(sessionId: string, placeId: string, vote: "heart" | "x") {
  const session = store.get(sessionId);
  if (!session) return null;
  const shortlist = session.shortlist.map((item) => {
    if (item.id !== placeId) return item;
    return {
      ...item,
      hearts: vote === "heart" ? item.hearts + 1 : item.hearts,
      skips: vote === "x" ? item.skips + 1 : item.skips
    };
  });
  const updated = { ...session, shortlist };
  store.set(sessionId, updated);
  return updated;
}
