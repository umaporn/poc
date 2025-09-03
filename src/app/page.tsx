
'use client';
export default function Home() {
  const issues = [
    { id: 1, title: "Web Push Notification", action: () => alert("Web Push Notification") },
    { id: 2, title: "Get Device ID", action: () => alert("Get Device ID") },
    { id: 3, title: "Scan QR Code", action: () => alert("Scan QR Code") },
    { id: 4, title: "Open Camera", action: () => alert("Open Camera") },
  ];

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6">Proof of Concept (POC)</h2>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-2 w-[70%] mx-auto py-4">
        {issues.map((issue) => (
          <button
            key={issue.id}
            onClick={issue.action}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-xl shadow hover:bg-red-800 transition"
          >
            {issue.title}
          </button>
        ))}
      </div>
    </>
  );
}
