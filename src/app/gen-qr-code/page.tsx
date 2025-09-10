"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QrGeneratorPage() {
  const [text, setText] = useState("https://example.com");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          QR Code Generator
        </h1>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-center mb-6">
          <QRCodeCanvas value={text} size={200} />
        </div>

        <p className="text-center text-gray-500 text-sm">
          Enter text or a URL above to generate your QR code.
        </p>
      </div>
    </div>
  );
}
