"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Helper function to add logs with timestamp
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev.slice(-19), logMessage]); // Keep last 20 logs
  };

  // Register service worker and check existing subscription
  useEffect(() => {
    addLog("🚀 Component mounted, initializing push notification system");
    
    if ("serviceWorker" in navigator) {
      addLog("✅ ServiceWorker API is supported");
      
      if ("PushManager" in window) {
        addLog("✅ Push messaging is supported");
      } else {
        addLog("❌ Push messaging is not supported", 'error');
        return;
      }

      addLog("📝 Registering service worker...");
      navigator.serviceWorker.register("/sw.js")
        .then(async (reg) => {
          addLog(`✅ Service Worker registered successfully. Scope: ${reg.scope}`, 'success');
          
          // Check if already subscribed
          addLog("🔍 Checking for existing subscription...");
          const existingSub = await reg.pushManager.getSubscription();
          
          if (existingSub) {
            setSubscription(existingSub);
            addLog("✅ Existing subscription found and restored", 'success');
            addLog(`📍 Subscription endpoint: ${existingSub.endpoint.substring(0, 50)}...`);
          } else {
            addLog("ℹ️ No existing subscription found");
          }
        })
        .catch((error) => {
          addLog(`❌ Service Worker registration failed: ${error.message}`, 'error');
        });
    } else {
      addLog("❌ ServiceWorker API is not supported in this browser", 'error');
    }
  }, []);

  async function subscribe() {
    addLog("🔔 Subscribe button clicked - starting subscription process");
    
    try {
      // Check if notifications are already granted
      addLog(`📋 Current notification permission: ${Notification.permission}`);
      
      // Ask permission first
      addLog("🙋 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      addLog(`📋 Permission result: ${permission}`);
      
      if (permission !== "granted") {
        addLog("❌ Notification permission denied", 'error');
        alert("Please allow notifications to subscribe!");
        return;
      }

      addLog("✅ Notification permission granted", 'success');
      addLog("⏳ Waiting for service worker to be ready...");
      
      const reg = await navigator.serviceWorker.ready;
      addLog("✅ Service worker is ready", 'success');

      // Check VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        addLog("❌ VAPID public key not found in environment variables", 'error');
        throw new Error("VAPID public key not configured");
      }
      addLog(`🔑 VAPID key found (length: ${vapidKey.length})`);

      addLog("🔄 Creating push subscription...");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      
      addLog("✅ Push subscription created successfully", 'success');
      addLog(`📍 New subscription endpoint: ${sub.endpoint.substring(0, 50)}...`);
      addLog(`🔐 Keys present - p256dh: ${!!sub.getKey('p256dh')}, auth: ${!!sub.getKey('auth')}`);

      // Send subscription to server
      addLog("📤 Sending subscription to server...");
      const response = await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ subscribe: sub }),
        headers: { "Content-Type": "application/json" },
      });

      addLog(`📡 Server response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const responseData = await response.text();
        addLog("✅ Successfully registered subscription with server", 'success');
        addLog(`📄 Server response: ${responseData.substring(0, 100)}`);
        
        // Only set subscription state after successful server registration
        setSubscription(sub);
        addLog("🎉 Subscription process completed successfully", 'success');
      } else {
        const errorText = await response.text();
        addLog(`❌ Server registration failed: ${errorText}`, 'error');
        throw new Error("Failed to register subscription with server");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`💥 Subscription failed: ${errorMessage}`, 'error');
      console.error("Full error details:", error);
      alert("Failed to subscribe. Please try again.");
    }
  }

  async function unsubscribe() {
    addLog("🚫 Unsubscribe button clicked - starting unsubscription process");
    
    try {
      if (!subscription) {
        addLog("⚠️ No subscription to unsubscribe from", 'warn');
        return;
      }

      addLog("📍 Current subscription endpoint: " + subscription.endpoint.substring(0, 50) + "...");

      // Unsubscribe from push manager
      addLog("🔄 Unsubscribing from push manager...");
      const success = await subscription.unsubscribe();
      
      if (success) {
        addLog("✅ Successfully unsubscribed from push notifications", 'success');

        // Notify server to remove subscription
        addLog("📤 Notifying server of unsubscription...");
        try {
          const response = await fetch("/api/send-notification", {
            method: "POST",
            body: JSON.stringify({ unsubscribe: subscription }),
            headers: { "Content-Type": "application/json" },
          });

          addLog(`📡 Server response status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const responseData = await response.text();
            addLog("✅ Server notified of unsubscription successfully", 'success');
            addLog(`📄 Server response: ${responseData.substring(0, 100)}`);
          } else {
            const errorText = await response.text();
            addLog(`⚠️ Failed to notify server of unsubscription: ${errorText}`, 'warn');
            addLog("ℹ️ Local unsubscribe succeeded anyway");
          }
        } catch (serverError) {
          const errorMessage = serverError instanceof Error ? serverError.message : String(serverError);
          addLog(`⚠️ Failed to notify server of unsubscription: ${errorMessage}`, 'warn');
        }

        // Clear local subscription state
        setSubscription(null);
        addLog("🎉 Unsubscription process completed successfully", 'success');
        alert("Successfully unsubscribed from notifications");
      } else {
        addLog("❌ Failed to unsubscribe from push manager", 'error');
        throw new Error("Failed to unsubscribe");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`💥 Unsubscription failed: ${errorMessage}`, 'error');
      console.error("Full error details:", error);
      alert("Failed to unsubscribe. Please try again.");
    }
  }

  async function sendNotification() {
    addLog("📨 Send notification button clicked");
    
    try {
      if (!subscription) {
        addLog("⚠️ No active subscription for sending notification", 'warn');
        return;
      }

      addLog("📤 Sending notification request to server...");
      const response = await fetch("/api/send-notification", {
        method: "POST",
        body: JSON.stringify({ send: true }),
        headers: { "Content-Type": "application/json" },
      });

      addLog(`📡 Server response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const responseData = await response.text();
        addLog("✅ Notification sent successfully", 'success');
        addLog(`📄 Server response: ${responseData.substring(0, 100)}`);
      } else {
        const errorText = await response.text();
        addLog(`❌ Failed to send notification: ${errorText}`, 'error');
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`💥 Failed to send notification: ${errorMessage}`, 'error');
      console.error("Full error details:", error);
      alert("Failed to send notification");
    }
  }

  const clearLogs = () => {
    setLogs([]);
    addLog("🧹 Logs cleared");
  };

  return (
    <main className="p-6 flex flex-col gap-4">
      <link rel="manifest" href="/manifest.json" /> 
      <h1 className="text-2xl font-bold">🔔 Next.js Push Demo</h1>

      <div className="flex gap-2">
        <button
          onClick={subscribe}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={!!subscription}
        >
          {subscription ? "Subscribed ✓" : "Subscribe"}
        </button>

        <button
          onClick={unsubscribe}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          disabled={!subscription}
        >
          Unsubscribe
        </button>
      </div>

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

      {/* Live Logs Section */}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">📋 Live Event Logs</h2>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Clear Logs
          </button>
        </div>
        <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 ${
                  log.includes('ERROR:') ? 'text-red-400' : 
                  log.includes('SUCCESS:') ? 'text-green-400' : 
                  log.includes('WARN:') ? 'text-yellow-400' : 
                  'text-blue-300'
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
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