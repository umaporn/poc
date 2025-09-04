"use client";

import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { Icon } from '@iconify/react';

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

  const copyToClipboard = () => {
    if (deviceId) {
      navigator.clipboard.writeText(deviceId);
      alert("Device ID copied!");
    }
  };

  return (
    <div className="items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg shadow-md w-[90%] mx-auto">
			<h1 className="text-2xl font-bold text-gray-800 mb-4">
				🔑 Your Device ID
			</h1>
			<div className="flex items-center justify-between bg-gray-200 rounded-lg p-3">
				<code className="text-gray-800 font-mono break-all">
					{deviceId || "Loading..."}
				</code>
				{deviceId && (
					<button
						onClick={copyToClipboard}
						className="ml-3 p-2 hover:bg-gray-200 rounded-lg transition"
						title="Copy"
					>
						<Icon icon="solar:copy-line-duotone" width="18" height="18" className="hover:cursor-pointer"/>
					</button>
				)}
			</div> 
    </div>
  );
}
