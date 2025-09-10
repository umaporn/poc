import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/libs/prisma";

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(req: Request) {
  const body = await req.json();

  // Save new subscription
  if (body.subscription) {
    const { endpoint, keys } = body.subscription;

    await prisma.subscriptions.upsert({
      where: { endpoint },
      update: {},
      create: {
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
    });

    return NextResponse.json({ saved: true });
  }

  // Send test notification
  if (body.send) {
    const subs = await prisma.subscriptions.findMany();

    const payload = JSON.stringify({
      title: "Next.js Push Demo 🚀",
      body: "This is a test notification!",
    });

    const results = await Promise.all(
      subs.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                auth: sub.auth,
                p256dh: sub.p256dh,
              },
            },
            payload
          )
          .catch((err) => {
            console.error("Push error:", err.body || err);
          })
      )
    );

    return NextResponse.json({ sent: true, results });
  }

  return NextResponse.json({ ok: true });
}
