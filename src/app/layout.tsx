
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import CursorLightEffect from '@/components/cursor-light-effect';
import AppHeader from '@/components/app-header'; // Import AppHeader

export const metadata: Metadata = {
  title: 'SameSameButDifferent', // Updated title
  description: 'Upload or capture images and let AI analyze them.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <CursorLightEffect />
        <AppHeader /> {/* Add the AppHeader component */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}

