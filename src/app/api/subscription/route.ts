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

  // Save subscription to DB
  if (body.subscribe) {
    const { endpoint, keys } = body.subscribe;

    await prisma.subscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    console.log("Saved subscription:", endpoint);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ ok: true });
}
