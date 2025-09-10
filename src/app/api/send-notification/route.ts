import { NextResponse } from "next/server";
import webpush from "web-push";

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Replace with DB or Redis in production
let subscriptions: any[] = [];

export async function POST(req: Request) {
  const body = await req.json();
  // Send test notification
  if (body.send) {
    const payload = JSON.stringify({
      title: "Next.js Push Demo 🚀",
      body: "This is a test notification!",
    });

    const results = await Promise.all(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, payload).catch((err) => {
          console.error("Push error:", err.body || err);
        })
      )
    );

    return NextResponse.json({ sent: true, results });
  }

  return NextResponse.json({ ok: true });
}
