// File: app/qr-reader/page.tsx
// Requires: Next.js 15 (App Router) + Tailwind CSS
// Optional (recommended) dependency for wider browser support:
//   npm i @zxing/browser
// This page uses the native BarcodeDetector API when available, and
// falls back to ZXing (@zxing/browser) for broader compatibility.

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Types for optional ZXing import (keeps TS happy if the lib isn't installed yet)
type ZXingReader = {
  decodeFromVideoDevice: (
    deviceId: string | null,
    video: HTMLVideoElement,
    callback: (
      result: { getText: () => string } | null,
      error: unknown,
      controls: { stop: () => void }
    ) => void
  ) => { stop: () => void };
  decodeFromImage: (img: HTMLImageElement) => Promise<{ getText: () => string }>;
};

export default function QRReaderPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingRef = useRef<ZXingReader | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const rafRef = useRef<number | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [usingNativeDetector, setUsingNativeDetector] = useState(false);

  const hasBarcodeDetector = useMemo(() => typeof window !== "undefined" && "BarcodeDetector" in window, []);

  // Load devices for camera selection
  const loadDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      // Prefer back camera if present
      const back = cams.find((d) => /back|rear|environment/i.test(d.label));
      setSelectedDeviceId((prev) => prev ?? (back?.deviceId || cams[0]?.deviceId || null));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("enumerateDevices failed", e);
    }
  }, []);

  // Try to dynamically import ZXing on the client
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@zxing/browser").catch(() => null);
        if (!cancelled && mod) {
          // BrowserMultiFormatReader has the APIs we need
          zxingRef.current = new mod.BrowserMultiFormatReader() as unknown as ZXingReader;
        }
      } catch {
        // ignore; we'll stick with native if available
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Request camera stream
  const startCamera = useCallback(async () => {
    stopEverything();
    setError(null);
    setResult(null);
    setScanning(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: { ideal: "environment" } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Torch support check
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.();
      const supportsTorch = !!(caps && "torch" in caps);
      setTorchSupported(supportsTorch);

      // Start detection loop
      if (hasBarcodeDetector) {
        setUsingNativeDetector(true);
        startNativeLoop();
      } else if (zxingRef.current) {
        setUsingNativeDetector(false);
        startZXingLoop();
      } else {
        setUsingNativeDetector(false);
        setError(
          "No BarcodeDetector and ZXing not installed yet. Run `npm i @zxing/browser` for fallback support."
        );
        setScanning(false);
      }
    } catch (e: any) {
      setPermission(e?.name === "NotAllowedError" ? "denied" : "prompt");
      setError(e?.message || "Failed to access camera");
      setScanning(false);
    }
  }, [hasBarcodeDetector, selectedDeviceId]);

  const stopEverything = useCallback(() => {
    // Stop native loop
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Stop ZXing if running
    if (zxingControlsRef.current) {
      try { zxingControlsRef.current.stop(); } catch {}
      zxingControlsRef.current = null;
    }
    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    loadDevices();
    return () => stopEverything();
  }, [loadDevices, stopEverything]);

  // Native BarcodeDetector loop
  const startNativeLoop = useCallback(() => {
    const detector = new (window as any).BarcodeDetector({ formats: ["qr_code", "ean_13", "code_128", "pdf417"] });

    const tick = async () => {
      if (!videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const text = barcodes[0].rawValue || barcodes[0].rawText || "";
          if (text) {
            setResult(text);
            stopEverything();
            return;
          }
        }
      } catch (e) {
        // ignore transient errors
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [stopEverything]);

  // ZXing loop
  const startZXingLoop = useCallback(() => {
    if (!zxingRef.current || !videoRef.current) return;
    try {
      zxingControlsRef.current = zxingRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (res, err, controls) => {
          if (res) {
            try { controls.stop(); } catch {}
            setResult(res.getText());
            stopEverything();
          }
          // ignore err; ZXing throws NotFound repeatedly while scanning
        }
      );
    } catch (e: any) {
      setError(e?.message || "ZXing failed to start");
      setScanning(false);
    }
  }, [selectedDeviceId, stopEverything]);

  // Toggle torch if supported
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const caps = track.getCapabilities?.();
    if (!caps || !("torch" in caps)) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] as any });
      setTorchOn((v) => !v);
    } catch (e) {
      setError("Failed to toggle flashlight");
    }
  }, [torchOn]);

  const handlePickImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (hasBarcodeDetector) {
      try {
        const bmp = await createImageBitmap(file);
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code", "ean_13", "code_128", "pdf417"] });
        const res = await detector.detect(bmp as any);
        if (res && res[0]) {
          setResult(res[0].rawValue || res[0].rawText || "");
          return;
        }
        setError("No QR/barcode found in image");
      } catch (e: any) {
        setError(e?.message || "Failed to decode image");
      }
      return;
    }

    if (zxingRef.current) {
      try {
        const img = new Image();
        img.onload = async () => {
          try {
            const out = await zxingRef.current!.decodeFromImage(img);
            setResult(out.getText());
          } catch {
            setError("No QR/barcode found in image");
          }
        };
        img.src = URL.createObjectURL(file);
      } catch (e: any) {
        setError(e?.message || "Failed to decode image with ZXing");
      }
      return;
    }

    setError("Image decode needs BarcodeDetector or @zxing/browser installed.");
  }, [hasBarcodeDetector]);

  const copyResult = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch {}
  }, [result]);

  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#22c55e"; // Tailwind green-500
    ctx.lineWidth = 3;
    const size = Math.min(w, h) * 0.5;
    const x = (w - size) / 2;
    const y = (h - size) / 2;
    ctx.strokeRect(x, y, size, size);
  }, []);

  useEffect(() => {
    const id = setInterval(drawOverlay, 500);
    return () => clearInterval(id);
  }, [drawOverlay]);

  return (
    <div className="min-h-svh w-full bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">QR / Barcode Scanner</h1>
          <p className="text-sm text-neutral-400">Next.js 15 • Camera + BarcodeDetector / ZXing fallback</p>
        </header>

        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg">
              <video ref={videoRef} playsInline className="w-full aspect-video object-cover" />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
              {!scanning && (
                <div className="absolute inset-0 grid place-items-center bg-black/50">
                  <p className="text-neutral-300 text-sm">Camera idle</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={startCamera}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black shadow hover:opacity-90"
              >
                {scanning ? "Restart" : "Start Scanning"}
              </button>
              <button
                onClick={stopEverything}
                className="rounded-2xl bg-neutral-800 px-4 py-2 text-sm text-white shadow hover:bg-neutral-700"
              >
                Stop
              </button>
              <label className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700">
                <input type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
                <span>Decode from image…</span>
              </label>
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className="rounded-2xl bg-neutral-800 px-4 py-2 text-sm text-white shadow hover:bg-neutral-700"
                >
                  {torchOn ? "Flashlight Off" : "Flashlight On"}
                </button>
              )}
            </div>
          </div>

          <aside className="md:col-span-4 space-y-4">
            <div className="rounded-2xl border border-neutral-800 p-4">
              <h2 className="mb-2 text-sm font-semibold text-neutral-200">Camera</h2>
              <div className="space-y-2">
                <select
                  className="w-full rounded-xl bg-neutral-900 p-2 text-sm"
                  value={selectedDeviceId ?? ""}
                  onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-400">
                  Permission: <span className="font-medium">{permission}</span>
                </p>
                <p className="text-xs text-neutral-400">
                  Engine: <span className="font-medium">{usingNativeDetector ? "BarcodeDetector" : zxingRef.current ? "ZXing" : "—"}</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-4">
              <h2 className="mb-2 text-sm font-semibold text-neutral-200">Result</h2>
              {result ? (
                <>
                  <textarea
                    readOnly
                    value={result}
                    className="h-28 w-full resize-none rounded-xl bg-neutral-900 p-2 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={copyResult} className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700">
                      Copy
                    </button>
                    <a
                      className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
                      href={result}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open as URL
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-xs text-neutral-400">No result yet. Point the camera at a QR code.</p>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-red-300">
                <h2 className="mb-1 text-sm font-semibold">Error</h2>
                <p className="text-xs">{error}</p>
              </div>
            )}
          </aside>
        </div>

        <footer className="mt-6 text-center text-xs text-neutral-500">
          Tips: On iOS, ensure Safari has camera permission. For broader support, install <code>@zxing/browser</code>.
        </footer>
      </div>
    </div>
  );
}
