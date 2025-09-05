// Fixed version of your component with timeout and better error handling

"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [subscribed, setSubscribed] = useState(false);
  const [showSafariInstallMsg, setShowSafariInstallMsg] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  // Debug logging function
  const addDebugLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    const logMessage = `${timestamp} ${emoji[type]} ${message}`;
    console.log(logMessage);
    setDebugLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    addDebugLog("Component mounted, starting initialization...");
    
    // Initial diagnostics
    addDebugLog(`Location: ${window.location.href}`);
    addDebugLog(`Protocol: ${window.location.protocol}`);
    addDebugLog(`User Agent: ${navigator.userAgent}`);
    
    // Check browser support
    if ("serviceWorker" in navigator) {
      addDebugLog("Service Worker API supported", 'success');
    } else {
      addDebugLog("Service Worker API NOT supported", 'error');
    }

    if ("PushManager" in window) {
      addDebugLog("Push Manager API supported", 'success');
    } else {
      addDebugLog("Push Manager API NOT supported", 'error');
    }

    if ("Notification" in window) {
      addDebugLog(`Notification API supported. Permission: ${Notification.permission}`, 'success');
    } else {
      addDebugLog("Notification API NOT supported", 'error');
    }
    
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; 
    addDebugLog(`VAPID key : ${vapidPublicKey!}`);
    
    // Check environment variables
    if (vapidPublicKey) {
      addDebugLog(`VAPID key found: ${vapidPublicKey.substring(0, 20)}...`, 'success');
    } else {
      addDebugLog("VAPID key NOT found in environment variables", 'error');
    }

    // Register service worker first
    registerServiceWorker();

    // Detect Safari / iOS
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);

    addDebugLog(`Browser detection - Safari: ${isSafari}, iOS: ${isIOS}`);

    if ((isSafari || isIOS) && !("PushManager" in window)) {
      setShowSafariInstallMsg(true);
      addDebugLog("Safari/iOS detected without PushManager support", 'warning');
    }

    // Capture the PWA install prompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      addDebugLog("PWA install prompt captured", 'success');
    });

    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      addDebugLog("App is running as installed PWA", 'info');
    }

  }, []);

  const registerServiceWorker = async () => {
    addDebugLog("Starting service worker registration...");
    
    if ("serviceWorker" in navigator) {
      try {
        // First, unregister any existing service workers that might be stuck
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        addDebugLog(`Found ${existingRegistrations.length} existing service worker registrations`);
        
        for (const registration of existingRegistrations) {
          addDebugLog(`Existing SW scope: ${registration.scope}`);
          // Optionally unregister old/stuck service workers
          // await registration.unregister();
        }

        addDebugLog("Attempting to register /sw.js...");
        
        // Check if service worker file exists first
        try {
          const swResponse = await fetch('/sw.js');
          if (!swResponse.ok) {
            addDebugLog(`Service worker file not found: ${swResponse.status} ${swResponse.statusText}`, 'error');
            return;
          }
          addDebugLog("Service worker file found", 'success');
        } catch (fetchError) {
          addDebugLog(`Error fetching service worker file: ${fetchError}`, 'error');
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Don't cache the service worker file
        });
        
        addDebugLog(`Service Worker registered successfully. Scope: ${registration.scope}`, 'success');
        addDebugLog(`Registration state: ${registration.installing ? 'installing' : registration.waiting ? 'waiting' : registration.active ? 'active' : 'unknown'}`);
        
        setSwRegistration(registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          addDebugLog('New service worker version found', 'info');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              addDebugLog(`Service worker state changed to: ${newWorker.state}`);
            });
          }
        });

        // Check current registration state
        if (registration.installing) {
          addDebugLog('Service worker is installing...', 'info');
        } else if (registration.waiting) {
          addDebugLog('Service worker is waiting...', 'warning');
        } else if (registration.active) {
          addDebugLog('Service worker is active', 'success');
        }

        // Force activation if there's a waiting service worker
        if (registration.waiting) {
          addDebugLog('Forcing service worker activation...', 'warning');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

      } catch (error) {
        addDebugLog(`Service Worker registration failed: ${error}`, 'error');
        console.error('Full error details:', error);
      }
    } else {
      addDebugLog('Service Worker not supported in this browser', 'error');
    }
  };

  // Helper function to wait for service worker with timeout
  const waitForServiceWorkerReady = async (timeoutMs = 10000) => {
    return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Service worker ready timeout'));
      }, timeoutMs);

      navigator.serviceWorker.ready
        .then((registration) => {
          clearTimeout(timeout);
          resolve(registration);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  };

  async function subscribe() {
    addDebugLog("=== Starting push notification subscription ===");
    
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      addDebugLog("Browser doesn't support push notifications", 'error');
      alert("Push notifications not supported in this browser.");
      return;
    }

    // Check notification permission
    addDebugLog(`Current notification permission: ${Notification.permission}`);
    
    if (Notification.permission !== "granted") {
      addDebugLog("Requesting notification permission...");
      try {
        const permission = await Notification.requestPermission();
        addDebugLog(`Permission request result: ${permission}`);
        
        if (permission !== "granted") {
          addDebugLog("Notification permission denied by user", 'error');
          alert("Please allow notifications to subscribe.");
          return;
        }
      } catch (permError) {
        addDebugLog(`Error requesting permission: ${permError}`, 'error');
        return;
      }
    }

    try {
      // Wait for service worker to be ready with timeout
      addDebugLog("Waiting for service worker to be ready...");
      
      let reg;
      try {
        reg = await waitForServiceWorkerReady(10000); // 10 second timeout
        addDebugLog(`Service Worker is ready. Scope: ${reg.scope}`, 'success');
      } catch (timeoutError) {
        addDebugLog(`Service worker ready timeout: ${timeoutError}`, 'error');
        
        // Try to get the registration directly
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          reg = registrations[0];
          addDebugLog(`Using first available registration: ${reg.scope}`, 'warning');
        } else {
          addDebugLog("No service worker registrations found", 'error');
          alert("Service worker not ready. Please refresh the page and try again.");
          return;
        }
      }

      // Check if already subscribed
      const existingSubscription = await reg.pushManager.getSubscription();
      if (existingSubscription) {
        addDebugLog("Found existing subscription:", 'warning');
        addDebugLog(`Endpoint: ${existingSubscription.endpoint}`);
        setSubscribed(true);
        return;
      }

      // Prepare VAPID key - Fixed the variable name!
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; // This was the bug!
      if (!vapidKey) {
        addDebugLog("VAPID public key is missing from environment variables", 'error');
        alert("VAPID key configuration error. Check console for details.");
        return;
      }

      addDebugLog(`Using VAPID key: ${vapidKey.substring(0, 20)}...`);
      
      let applicationServerKey;
      try {
        applicationServerKey = urlBase64ToUint8Array(vapidKey);
        addDebugLog(`VAPID key converted successfully. Length: ${applicationServerKey.length}`, 'success');
      } catch (keyError) {
        addDebugLog(`Error converting VAPID key: ${keyError}`, 'error');
        alert("Invalid VAPID key format. Check console for details.");
        return;
      }

      // Attempt subscription
      addDebugLog("Attempting to subscribe to push manager...");
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      addDebugLog("Push subscription successful!", 'success');
      addDebugLog(`Subscription endpoint: ${subscription.endpoint}`);
      addDebugLog(`Keys - p256dh: ${subscription.getKey('p256dh') ? 'present' : 'missing'}`);
      addDebugLog(`Keys - auth: ${subscription.getKey('auth') ? 'present' : 'missing'}`);

      // Save subscription to server
      addDebugLog("Saving subscription to server...");
      try {
        const response = await fetch("/api/save-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        addDebugLog("Subscription saved to server successfully", 'success');
        addDebugLog(`Server response: ${JSON.stringify(result)}`);
        
      } catch (serverError) {
        addDebugLog(`Error saving subscription to server: ${serverError}`, 'warning');
        addDebugLog("Subscription created locally but not saved to server", 'warning');
      }

      setSubscribed(true);
      alert("Subscribed to push notifications!");
      
    } catch (error) {
      addDebugLog(`Subscription failed: ${error}`, 'error');
      console.error('Full subscription error:', error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Registration failed')) {
          alert("Service worker registration failed. Please refresh and try again.");
        } else if (error.message.includes('permission')) {
          alert("Permission denied. Please enable notifications in your browser settings.");
        } else if (error.message.includes('not supported')) {
          alert("Push notifications are not supported in this browser.");
        } else {
          alert(`Subscription failed: ${error.message}`);
        }
      } else {
        alert("Subscription failed. Check console for details.");
      }
    }
  }

  // Add a manual service worker reset function
  const resetServiceWorker = async () => {
    addDebugLog("Resetting service worker...");
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        addDebugLog(`Unregistering: ${registration.scope}`);
        await registration.unregister();
      }
      
      // Clear all caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        addDebugLog(`Deleting cache: ${cacheName}`);
        await caches.delete(cacheName);
      }
      
      addDebugLog("Service worker reset complete. Please refresh the page.", 'success');
      setSwRegistration(null);
      setSubscribed(false);
      
    } catch (error) {
      addDebugLog(`Error resetting service worker: ${error}`, 'error');
    }
  };

  async function sendTestNotification() {
    addDebugLog("Sending test notification...");
    
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🚀 Next.js PWA",
          body: "Push notification works!",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      addDebugLog("Test notification sent successfully", 'success');
      addDebugLog(`Server response: ${JSON.stringify(result)}`);
      
    } catch (error) {
      addDebugLog(`Error sending test notification: ${error}`, 'error');
      alert(`Failed to send test notification: ${error}`);
    }
  }

  function installPWA() {
    addDebugLog("Attempting to install PWA...");
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((result: any) => {
        addDebugLog(`PWA install prompt result: ${result.outcome}`);
        setDeferredPrompt(null);
      });
    } else {
      addDebugLog("No deferred install prompt available", 'warning');
    }
  }

  const clearDebugLogs = () => {
    setDebugLogs([]);
    addDebugLog("Debug logs cleared");
  };

  const exportDebugLogs = () => {
    const logsText = debugLogs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pwa-debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addDebugLog("Debug logs exported", 'info');
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Next.js 15 PWA Push Demo</h1>

      {showSafariInstallMsg && (
        <div className="p-4 bg-yellow-200 text-yellow-800 rounded">
          Install this PWA to enable push notifications.
        </div>
      )}

      <div className="flex flex-col gap-2 items-center">
        <div className="text-sm text-gray-600">
          Service Worker: {swRegistration ? '✅ Registered' : '⏳ Loading...'}
        </div>

        {deferredPrompt && (
          <button
            onClick={installPWA}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            📱 Install PWA
          </button>
        )}

        <button
          onClick={subscribe}
          disabled={subscribed}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
        >
          {subscribed ? "✅ Subscribed" : "🔔 Subscribe to Push"}
        </button>

        <button
          onClick={sendTestNotification}
          disabled={!subscribed}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400 hover:bg-green-700 transition-colors"
        >
          🚀 Send Test Notification
        </button>

        <button
          onClick={resetServiceWorker}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          🔄 Reset Service Worker
        </button>

        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          {showDebugPanel ? '🙈 Hide Debug' : '🔍 Show Debug'}
        </button>
      </div>

      {showDebugPanel && (
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">🐛 Debug Console</h2>
            <div className="flex gap-2">
              <button
                onClick={exportDebugLogs}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                💾 Export
              </button>
              <button
                onClick={clearDebugLogs}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded max-h-96 overflow-y-auto font-mono text-sm border">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No debug logs yet...</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1 break-all">
                  {log}
                </div>
              ))
            )}
            {debugLogs.length > 0 && (
              <div className="text-gray-500 mt-2 text-xs">
                --- End of logs ({debugLogs.length} entries) ---
              </div>
            )}
          </div>

          <div className="mt-4 bg-gray-100 p-4 rounded text-sm">
            <h3 className="font-semibold mb-2">💡 Common Issues & Solutions:</h3>
            <div className="space-y-1 text-xs">
              <div><strong>❌ Service worker stuck:</strong> Click "Reset Service Worker" button</div>
              <div><strong>❌ Service worker file not found:</strong> Create <code>public/sw.js</code></div>
              <div><strong>❌ Not served over HTTPS:</strong> Push notifications require HTTPS (except localhost)</div>
              <div><strong>❌ Invalid VAPID key:</strong> Check your <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> in .env.local</div>
              <div><strong>❌ Permission denied:</strong> User must grant notification permission</div>
              <div><strong>❌ Browser not supported:</strong> Some browsers don't support push notifications</div>
              <div><strong>❌ Server API missing:</strong> Create <code>/api/save-subscription</code> and <code>/api/send-notification</code> endpoints</div>
            </div>
          </div>
        </div>
      )}
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
}s