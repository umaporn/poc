import { NextResponse } from "next/server";
import webpush from "web-push";
import { subscriptions } from "@/libs/subscriptions";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error("VAPID public and private keys must be defined in environment variables.");
}

webpush.setVapidDetails(
  "mailto:test@example.com",
  vapidPublicKey,
  vapidPrivateKey
);

export async function POST(req: Request) {
  const body = await req.json();
  const payload = JSON.stringify({
    title: body.title || "Hello from Next.js PWA!",
    body: body.body || "This is a test push notification.",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => webpush.sendNotification(sub, payload))
  );

  return NextResponse.json({ results });
}
