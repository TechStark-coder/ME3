
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// import CursorLightEffect from '@/components/cursor-light-effect'; // Temporarily commented out
import AppHeader from '@/components/app-header'; 

export const metadata: Metadata = {
  title: 'SameSameButDifferent', 
  description: 'Upload or capture images and let AI analyze them.', 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {/* <CursorLightEffect /> */} {/* Temporarily commented out */}
        <AppHeader /> 
        {children}
        <Toaster />
      </body>
    </html>
  );
}

