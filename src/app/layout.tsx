
import type { Metadata } from 'next';
// Removed Geist fonts as per globals.css change
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import CursorLightEffect from '@/components/cursor-light-effect'; // Import CursorLightEffect

export const metadata: Metadata = {
  title: 'Spot the Difference AI', // Updated title
  description: 'Upload or capture two images and let AI find the differences.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Removed font variables from body className */}
      <body className={`antialiased`}>
        <CursorLightEffect /> {/* Add the cursor light effect component */}
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
