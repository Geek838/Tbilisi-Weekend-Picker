import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/sessions";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  return NextResponse.json({ session });
}
