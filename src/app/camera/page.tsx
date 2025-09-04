"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from '@iconify/react';

export default function CameraTogglePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    initCamera();
 
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const newPhoto = canvas.toDataURL("image/png");
      setPhotos((prev) => [...prev, newPhoto]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 ">
      <h1 className="text-xl font-bold mb-4 text-black">{facingMode === "user" ? "Front" : "Back"} Camera & Multi-Capture</h1>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full max-w-md rounded-lg shadow-lg"
        />
      )}

      <div className="flex gap-4 mt-4">
        <button
          onClick={toggleCamera}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg shadow-md flex items-center gap-2 hover:bg-blue-500 hover:cursor-pointer transition"
        >
					<Icon icon="material-symbols:cameraswitch-rounded" width="56" height="56" />
          Switch to {facingMode === "user" ? "Back" : "Front"} Camera
        </button>

        <button
          onClick={capturePhoto}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-md flex items-center gap-2 hover:bg-emerald-700 hover:cursor-pointer transition"
        >
          <Icon icon="f7:camera" width="56" height="56" />
					 Capture
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {photos.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Captured Photos:</h2>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Captured ${index + 1}`}
                className="rounded-lg shadow-md"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
