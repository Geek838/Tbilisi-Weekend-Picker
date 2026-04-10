import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/server/sessions";
import type { SessionState } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<SessionState, "id" | "createdAt">;

  if (!body?.shortlist?.length) {
    return NextResponse.json({ error: "Shortlist is required." }, { status: 400 });
  }

  const session = createSession(body);
  return NextResponse.json({ session });
}
