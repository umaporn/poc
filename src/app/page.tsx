
'use client';
export default function Home() {
  const getDeviceId = () => {
    window.location.href = "/device";
  };
  const openCamera = () => {
    window.location.href = "/camera";
  } 
  const openQRCodeScanner = () => {
    window.location.href = "/qrcode";
  }
  const openPWA = () => {
    window.location.href = "/PWA";
  }

  // List of issues
  const issues = [
    { id: 1, title: "Web Push Notification", action: () => openPWA() },
    { id: 2, title: "Get Device ID", action: () => getDeviceId() },
    { id: 3, title: "Scan QR Code", action: () => openQRCodeScanner() },
    { id: 4, title: "Open Camera", action: () => openCamera() },
  ];

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6">Proof of Concept (POC)</h2>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-2 w-[70%] mx-auto py-4">
        {issues.map((issue) => (
          <button
            key={issue.id}
            onClick={issue.action}
            className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow hover:bg-red-800 transition hover:cursor-pointer"
          >
            {issue.title}
          </button>
        ))}
      </div>
    </>
  );
}
