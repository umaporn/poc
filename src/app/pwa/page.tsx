"use client";

import { useState } from "react";

export default function Home() {
  const [subscribed, setSubscribed] = useState(false);

  async function subscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications not supported in this browser.");
      return;
    }

    const reg = await navigator.serviceWorker.ready;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    await fetch("/api/save-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    setSubscribed(true);
    alert("Subscribed to push notifications!");
  }

  async function sendTestNotification() {
		console.log("Sending test notification...");
    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🚀 Next.js PWA",
        body: "Push notification works!",
      }),
    });
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Next.js 15 PWA Push Demo</h1>

      <button
        onClick={subscribe}
        disabled={subscribed}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {subscribed ? "Subscribed ✅" : "Subscribe to Push"}
      </button>

      <button
        onClick={sendTestNotification}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Send Test Notification
      </button>
    </main>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
