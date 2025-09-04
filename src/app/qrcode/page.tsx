'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function QRCodeReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [reader, setReader] = useState<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    setReader(codeReader);

    return () => {
      if (codeReader) {
        codeReader.reset();
      }
    };
  }, []);

  const startScan = async () => {
    if (!reader || !videoRef.current) return;

    try {
      setError('');
      setIsScanning(true);

      const videoInputDevices = await reader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }
 
      let selectedDeviceId = videoInputDevices[0].deviceId;
      
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
      }

      reader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) {
          setResult(result.getText());
          stopScan();
        }
        if (err && !(err instanceof Error)) {
          // Only log actual errors, not the continuous scanning attempts
          console.log('Scanning...');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    if (reader) {
      reader.reset();
    }
    setIsScanning(false);
  };

  const clearResult = () => {
    setResult('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-400 text-white p-6 text-center">
          <h1 className="text-2xl font-bold">QR Code Reader</h1>
          <p className="mt-2 opacity-90">Scan QR codes with your camera</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Camera View */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            {!isScanning && (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>Camera preview will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!isScanning ? (
              <button
                onClick={startScan}
                className="flex-1 bg-blue-400 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScan}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Stop Scanning
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-green-800 font-medium mb-2">QR Code Detected:</h3>
                  <p className="text-green-700 break-all text-sm">{result}</p>
                  
                  {/* Action buttons for different result types */}
                  <div className="mt-3 flex gap-2">
                    {result.startsWith('http') && (
                      <a
                        href={result}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Open Link
                      </a>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(result)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={clearResult}
                  className="text-green-600 hover:text-green-800 ml-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}