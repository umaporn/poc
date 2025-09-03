import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POC For Developers",
  description: "POC For Developers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex flex-col min-h-screen">
        
        <header className="bg-red-500 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold">POC FOR DEVELOPER</h1>
          </div>
        </header>
 
        <main className="flex-grow container mx-auto p-4">
          {children}
        </main>
 
        <footer className="bg-gray-800 text-white p-4 mt-4">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()}. All rights reserved.</p>
          </div>
        </footer>
      </div>
      </body>
    </html>
  );
}
