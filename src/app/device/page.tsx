"use client";

import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export default function DevicePage() {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => { 
    const loadFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get(); 
      setDeviceId(result.visitorId);
    };

    loadFingerprint();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Your Device ID (Fingerprint)</h1>
      <p className="mt-2 p-2 bg-gray-100 rounded">{deviceId || "Loading..."}</p>
    </div>
  );
}
