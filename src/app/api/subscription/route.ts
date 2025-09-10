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

	// Save subscription
	if (body.subscribe) {
		subscriptions.push(body.subscribe);
		console.log("New subscription saved:", body.subscribe.endpoint);
		return NextResponse.json({ success: true });
	}
 

	return NextResponse.json({ ok: true });
}
