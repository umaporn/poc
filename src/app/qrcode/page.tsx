"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export default function QRReaderPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (hasBarcodeDetector) startNativeLoop();
    } catch (e: any) {
      setError(e?.message || "Failed to access camera");
      setScanning(false);
    }
  }, [hasBarcodeDetector]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startNativeLoop = useCallback(() => {
    const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

    const tick = async () => {
      if (!videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          setResult(barcodes[0].rawValue || "");
          stopCamera();
          return;
        }
      } catch {
        // ignore
      }
      if (scanning) requestAnimationFrame(tick);
    };
    tick();
  }, [scanning, stopCamera]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-black p-4">
      <h1 className="text-xl font-semibold mb-4">Simple QR Code Scanner</h1>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gray-100">
        <video ref={videoRef} playsInline className="w-full aspect-video object-cover" />
        {!scanning && (
          <div className="absolute inset-0 grid place-items-center bg-black/10">
            <p className="text-black text-sm">Camera idle</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={startCamera}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black"
        >
          {scanning ? "Restart" : "Start"}
        </button>
        <button
          onClick={stopCamera}
          className="rounded-xl bg-gray-200 px-4 py-2 text-sm"
        >
          Stop
        </button>
      </div>

      <div className="mt-4 w-full max-w-md rounded-xl border border-neutral-800 p-3">
        <h2 className="text-sm font-semibold mb-2">Result</h2>
        {result ? (
          <p className="text-emerald-400 break-all text-sm">{result}</p>
        ) : (
          <p className="text-neutral-400 text-sm">No result yet</p>
        )}
      </div>

      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
    </div>
  );
}
