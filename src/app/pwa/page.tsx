"use client";
import { useEffect, useState } from "react";

export default function ServiceWorkerDebugger() {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>({});

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
    performComprehensiveDiagnostics();
  }, []);

  const performComprehensiveDiagnostics = async () => {
    addDebugLog("=== COMPREHENSIVE SERVICE WORKER DIAGNOSTICS ===");
    
    // 1. Basic Environment Checks
    addDebugLog("1. ENVIRONMENT CHECKS:", 'info');
    addDebugLog(`   URL: ${window.location.href}`);
    addDebugLog(`   Protocol: ${window.location.protocol}`);
    addDebugLog(`   Host: ${window.location.host}`);
    addDebugLog(`   Is HTTPS: ${window.location.protocol === 'https:' || window.location.hostname === 'localhost'}`);
    
    // 2. Browser API Support
    addDebugLog("2. BROWSER API SUPPORT:", 'info');
    const serviceWorkerSupported = 'serviceWorker' in navigator;
    const pushManagerSupported = 'PushManager' in window;
    const notificationSupported = 'Notification' in window;
    
    addDebugLog(`   Service Worker API: ${serviceWorkerSupported ? '✅' : '❌'}`);
    addDebugLog(`   Push Manager API: ${pushManagerSupported ? '✅' : '❌'}`);
    addDebugLog(`   Notification API: ${notificationSupported ? '✅' : '❌'}`);
    
    if (notificationSupported) {
      addDebugLog(`   Notification Permission: ${Notification.permission}`);
    }
    
    // 3. Browser Detection
    addDebugLog("3. BROWSER DETECTION:", 'info');
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && !/Edg|OPR/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    
    setBrowserInfo({ isChrome, isFirefox, isSafari, isEdge, isIOS, isAndroid });
    
    addDebugLog(`   Chrome: ${isChrome}`);
    addDebugLog(`   Firefox: ${isFirefox}`);
    addDebugLog(`   Safari: ${isSafari}`);
    addDebugLog(`   Edge: ${isEdge}`);
    addDebugLog(`   iOS: ${isIOS}`);
    addDebugLog(`   Android: ${isAndroid}`);
    
    // 4. Check for existing service workers
    if (serviceWorkerSupported) {
      addDebugLog("4. EXISTING SERVICE WORKERS:", 'info');
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        addDebugLog(`   Found ${registrations.length} existing registrations`);
        
        for (let i = 0; i < registrations.length; i++) {
          const reg = registrations[i];
          addDebugLog(`   Registration ${i + 1}:`);
          addDebugLog(`     Scope: ${reg.scope}`);
          addDebugLog(`     Installing: ${reg.installing ? 'Yes' : 'No'}`);
          addDebugLog(`     Waiting: ${reg.waiting ? 'Yes' : 'No'}`);
          addDebugLog(`     Active: ${reg.active ? 'Yes' : 'No'}`);
          
          if (reg.active) {
            addDebugLog(`     Active SW URL: ${reg.active.scriptURL}`);
            addDebugLog(`     Active SW State: ${reg.active.state}`);
          }
        }
      } catch (error) {
        addDebugLog(`   Error checking existing registrations: ${error}`, 'error');
      }
    }
    
    // 5. Check for existing caches
    addDebugLog("5. EXISTING CACHES:", 'info');
    try {
      const cacheNames = await caches.keys();
      addDebugLog(`   Found ${cacheNames.length} caches`);
      for (const cacheName of cacheNames) {
        addDebugLog(`   Cache: ${cacheName}`);
      }
    } catch (error) {
      addDebugLog(`   Error checking caches: ${error}`, 'error');
    }
    
    // 6. Check service worker file
    addDebugLog("6. SERVICE WORKER FILE CHECK:", 'info');
    try {
      const swResponse = await fetch('/sw.js', { cache: 'no-cache' });
      addDebugLog(`   SW file status: ${swResponse.status}`);
      addDebugLog(`   SW file size: ${swResponse.headers.get('content-length') || 'unknown'} bytes`);
      addDebugLog(`   SW file type: ${swResponse.headers.get('content-type') || 'unknown'}`);
      
      if (swResponse.ok) {
        const swContent = await swResponse.text();
        addDebugLog(`   SW content length: ${swContent.length} characters`);
        addDebugLog(`   Contains 'push': ${swContent.includes('push')}`);
        addDebugLog(`   Contains 'install': ${swContent.includes('install')}`);
      }
    } catch (error) {
      addDebugLog(`   Error checking SW file: ${error}`, 'error');
    }
    
    // 7. Network connectivity
    addDebugLog("7. NETWORK STATUS:", 'info');
    addDebugLog(`   Online: ${navigator.onLine}`);
    addDebugLog(`   Connection: ${(navigator as any).connection?.effectiveType || 'unknown'}`);
    
    // 8. Security context
    addDebugLog("8. SECURITY CONTEXT:", 'info');
    addDebugLog(`   Secure Context: ${window.isSecureContext}`);
    addDebugLog(`   Cross-Origin Isolated: ${window.crossOriginIsolated}`);
    
    addDebugLog("=== DIAGNOSTICS COMPLETE ===");
  };

  const forceCleanRegistration = async () => {
    addDebugLog("=== FORCE CLEAN REGISTRATION ===");
    
    try {
      // Step 1: Unregister all service workers
      addDebugLog("Step 1: Unregistering all service workers...");
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        addDebugLog(`Unregistering: ${registration.scope}`);
        const success = await registration.unregister();
        addDebugLog(`Unregister result: ${success}`);
      }
      
      // Step 2: Clear all caches
      addDebugLog("Step 2: Clearing all caches...");
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        addDebugLog(`Deleting cache: ${cacheName}`);
        const success = await caches.delete(cacheName);
        addDebugLog(`Delete result: ${success}`);
      }
      
      // Step 3: Wait for cleanup
      addDebugLog("Step 3: Waiting for cleanup...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Check if cleanup was successful
      const remainingRegs = await navigator.serviceWorker.getRegistrations();
      const remainingCaches = await caches.keys();
      
      addDebugLog(`Remaining registrations: ${remainingRegs.length}`);
      addDebugLog(`Remaining caches: ${remainingCaches.length}`);
      
      addDebugLog("=== CLEANUP COMPLETE ===", 'success');
      
    } catch (error) {
      addDebugLog(`Cleanup failed: ${error}`, 'error');
    }
  };

  const testBasicRegistration = async () => {
    addDebugLog("=== TESTING BASIC REGISTRATION ===");
    
    if (!('serviceWorker' in navigator)) {
      addDebugLog("Service Worker not supported", 'error');
      return;
    }
    
    try {
      addDebugLog("Attempting basic registration...");
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      addDebugLog(`Registration successful!`, 'success');
      addDebugLog(`Scope: ${registration.scope}`);
      addDebugLog(`Update via cache: ${registration.updateViaCache}`);
      
      setSwRegistration(registration);
      
      // Monitor registration state
      const monitorRegistration = (worker: ServiceWorker, name: string) => {
        if (worker) {
          addDebugLog(`${name} worker found`);
          addDebugLog(`${name} state: ${worker.state}`);
          
          worker.addEventListener('statechange', () => {
            addDebugLog(`${name} state changed to: ${worker.state}`);
          });
        }
      };
      
      monitorRegistration(registration.installing, 'Installing');
      monitorRegistration(registration.waiting, 'Waiting');
      monitorRegistration(registration.active, 'Active');
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        addDebugLog('Update found!', 'info');
        monitorRegistration(registration.installing, 'New Installing');
      });
      
      // Wait for ready state
      addDebugLog("Waiting for service worker to be ready...");
      const readyRegistration = await navigator.serviceWorker.ready;
      addDebugLog(`Service worker ready! Scope: ${readyRegistration.scope}`, 'success');
      
    } catch (error) {
      addDebugLog(`Registration failed: ${error}`, 'error');
      
      // Detailed error analysis
      if (error instanceof Error) {
        addDebugLog(`Error name: ${error.name}`);
        addDebugLog(`Error message: ${error.message}`);
        addDebugLog(`Error stack: ${error.stack?.substring(0, 200)}...`);
      }
    }
  };

  const testMinimalServiceWorker = async () => {
    addDebugLog("=== TESTING WITH MINIMAL SERVICE WORKER ===");
    
    // Create a minimal service worker content
    const minimalSW = `
console.log('Minimal SW loaded');

self.addEventListener('install', event => {
  console.log('Minimal SW installing');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Minimal SW activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  console.log('Push received:', event);
  event.waitUntil(
    self.registration.showNotification('Test', {
      body: 'Minimal SW push works!'
    })
  );
});
`;
    
    try {
      // Create a blob URL for the minimal service worker
      const blob = new Blob([minimalSW], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      
      addDebugLog("Created minimal service worker blob");
      addDebugLog(`Blob URL: ${swUrl}`);
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/'
      });
      
      addDebugLog("Minimal SW registered successfully!", 'success');
      setSwRegistration(registration);
      
      // Cleanup blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(swUrl), 10000);
      
    } catch (error) {
      addDebugLog(`Minimal SW registration failed: ${error}`, 'error');
    }
  };

  const subscribe = async () => {
    if (!swRegistration) {
      addDebugLog("No service worker registration available", 'error');
      return;
    }
    
    addDebugLog("=== TESTING PUSH SUBSCRIPTION ===");
    
    try {
      // Request permission
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        addDebugLog(`Permission result: ${permission}`);
        if (permission !== 'granted') return;
      }
      
      // Mock VAPID key for testing
      const mockVapidKey = "BEl62iUYgUivxIkv69yViEuiBIa40HI8Tks2fIgTF5qklxvhkYq7p7cgLzw3lbZXmDu8w5sH7dNxEPYSjFkLF3o";
      const applicationServerKey = urlBase64ToUint8Array(mockVapidKey);
      
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      addDebugLog("Push subscription successful!", 'success');
      setSubscribed(true);
      
    } catch (error) {
      addDebugLog(`Push subscription failed: ${error}`, 'error');
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
    addDebugLog("Logs cleared");
  };

  const exportLogs = () => {
    const logsText = debugLogs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sw-debug-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🔧 Service Worker Troubleshooter</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🛠️ Diagnostic Tools</h2>
          
          <button
            onClick={performComprehensiveDiagnostics}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🔍 Run Full Diagnostics
          </button>
          
          <button
            onClick={forceCleanRegistration}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🧹 Force Clean Everything
          </button>
          
          <button
            onClick={testBasicRegistration}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            📝 Test Basic Registration
          </button>
          
          <button
            onClick={testMinimalServiceWorker}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            ⚡ Test Minimal SW
          </button>
          
          <button
            onClick={subscribe}
            disabled={!swRegistration}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded disabled:bg-gray-400 hover:bg-orange-700 transition-colors"
          >
            🔔 Test Push Subscription
          </button>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">📊 Status</h2>
          
          <div className="bg-gray-100 p-4 rounded">
            <div className="space-y-2 text-sm">
              <div>SW Registration: {swRegistration ? '✅ Active' : '❌ None'}</div>
              <div>Push Subscription: {subscribed ? '✅ Active' : '❌ None'}</div>
              <div>Browser: {browserInfo.isChrome ? 'Chrome' : browserInfo.isFirefox ? 'Firefox' : browserInfo.isSafari ? 'Safari' : 'Other'}</div>
              <div>Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'unknown'}</div>
              <div>SW Support: {'serviceWorker' in navigator ? '✅' : '❌'}</div>
              <div>Push Support: {'PushManager' in window ? '✅' : '❌'}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Actions:</h3>
            <button
              onClick={clearLogs}
              className="w-full px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              🗑️ Clear Logs
            </button>
            <button
              onClick={exportLogs}
              className="w-full px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm"
            >
              💾 Export Logs
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-black text-green-400 p-4 rounded max-h-96 overflow-y-auto font-mono text-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-bold">🐛 Debug Console ({debugLogs.length} entries)</span>
        </div>
        
        {debugLogs.length === 0 ? (
          <div className="text-gray-500">Click "Run Full Diagnostics" to start...</div>
        ) : (
          debugLogs.map((log, index) => (
            <div key={index} className="mb-1 break-all">
              {log}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-bold text-yellow-800 mb-2">🚨 Common Solutions:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Hard refresh:</strong> Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)</li>
          <li>• <strong>Clear browser data:</strong> DevTools → Application → Storage → Clear storage</li>
          <li>• <strong>Check HTTPS:</strong> Service workers require HTTPS (except localhost)</li>
          <li>• <strong>Incognito mode:</strong> Test in private/incognito window</li>
          <li>• <strong>Check console:</strong> Look for errors in browser DevTools console</li>
          <li>• <strong>Different browser:</strong> Try Chrome, Firefox, or Edge</li>
        </ul>
      </div>
    </div>
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