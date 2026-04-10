import { NextRequest, NextResponse } from "next/server";
import { updateVote } from "@/lib/server/sessions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { placeId?: string; vote?: "heart" | "x" };

  if (!body.placeId || !body.vote) {
    return NextResponse.json({ error: "placeId and vote are required." }, { status: 400 });
  }

  const session = updateVote(id, body.placeId, body.vote);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ session });
}
