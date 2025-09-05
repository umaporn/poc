import { NextResponse } from "next/server";
import { subscriptions } from "@/libs/subscriptions";

export async function POST(req: Request) {
  const body = await req.json();
  subscriptions.push(body);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(subscriptions);
}
