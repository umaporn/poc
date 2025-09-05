"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("Service Worker registered:", reg);
      });
    }
  }, []);

  async function subscribe() {
    try {
      // Ask permission first
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Please allow notifications to subscribe!");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      console.log("Subscription created:", sub);

      // Send subscription to server and wait for response
      const response = await fetch("/api/send-notification", {
        method: "POST",
        body: JSON.stringify({ subscribe: sub }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Only set subscription state after successful server registration
        setSubscription(sub);
        console.log("Successfully subscribed and registered with server");
      } else {
        throw new Error("Failed to register subscription with server");
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Failed to subscribe. Please try again.");
    }
  }

  async function sendNotification() {
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        body: JSON.stringify({ send: true }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        console.log("Notification sent successfully");
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Failed to send notification");
    }
  }

  return (
    <main className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">🔔 Next.js Push Demo</h1>

      <button
        onClick={subscribe}
        className="px-4 py-2 bg-blue-500 text-white rounded"
        disabled={!!subscription}
      >
        {subscription ? "Subscribed ✓" : "Subscribe"}
      </button>

      <button
        onClick={sendNotification}
        disabled={!subscription}
        className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        Send Test Notification
      </button>

      {subscription && (
        <div className="text-sm text-gray-600">
          <p>✅ Push notifications enabled</p>
        </div>
      )}
    </main>
  );
}

// Helper: convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}