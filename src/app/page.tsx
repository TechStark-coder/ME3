"use client";

import React, { useState, useEffect } from 'react';
import ImageSelector from '@/components/image-selector';

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [previousObjectUrl, setPreviousObjectUrl] = useState<string | null>(null);

  const handleImageSelect = (imageUrl: string) => {
    // Revoke the previous object URL if it exists to prevent memory leaks
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }
    setBackgroundImage(`url(${imageUrl})`);
    // Store the new object URL to revoke later
    setPreviousObjectUrl(imageUrl.startsWith('blob:') ? imageUrl : null);
  };

  // Apply background image to the body element
  useEffect(() => {
    if (backgroundImage) {
      document.body.style.backgroundImage = backgroundImage;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      // Ensure body takes full height for background visibility
      document.body.style.minHeight = '100vh';
    } else {
      // Reset background styles to allow CSS to take over
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.minHeight = ''; // Reset min height
    }

    // Cleanup function to remove background style when component unmounts
    // and revoke the last object URL
    return () => {
      // Reset styles on unmount
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.minHeight = '';
      if (previousObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl);
      }
    };
  }, [backgroundImage, previousObjectUrl]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 relative z-10">
       {/* Container for the glassmorphic effect */}
      <div className="glassmorphic p-6 md:p-10 w-full max-w-md md:max-w-lg text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
          Welcome to ImageCanvas
        </h1>
        <p className="text-muted-foreground mb-8 text-base md:text-lg">
          Choose an image to set as your background.
        </p>
        <ImageSelector onImageSelect={handleImageSelect} />
      </div>
    </main>
  );
}
