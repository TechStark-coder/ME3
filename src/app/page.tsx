"use client";

import React, { useState, useEffect } from 'react';
import ImageSelector from '@/components/image-selector';

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [previousObjectUrl, setPreviousObjectUrl] = useState<string | null>(null);
  // State to hold the message about the uploaded image
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const handleImageSelect = (imageUrl: string, fileName?: string) => {
    // Revoke the previous object URL if it exists to prevent memory leaks
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }
    setBackgroundImage(`url(${imageUrl})`);
    // Store the new object URL to revoke later if it's a blob URL
    setPreviousObjectUrl(imageUrl.startsWith('blob:') ? imageUrl : null);

    // Set the upload message
    if (fileName) {
      setUploadMessage(`Image uploaded: ${fileName}`);
    } else {
      setUploadMessage('Image captured successfully!');
    }
  };

  // Apply background image to the body element
  useEffect(() => {
    if (backgroundImage) {
      document.body.style.backgroundImage = backgroundImage;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed'; // Keep background fixed
      // Ensure body takes full height for background visibility
      document.body.style.minHeight = '100vh';
    } else {
      // Reset background styles to allow CSS (globals.css) to take over
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.minHeight = '100vh'; // Keep minHeight
      document.body.style.backgroundAttachment = ''; // Reset attachment
    }

    // Cleanup function to remove background style when component unmounts
    // and revoke the last object URL
    return () => {
      // Reset styles on unmount to default gradient
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.minHeight = '100vh';
      document.body.style.backgroundAttachment = '';

      if (previousObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl);
      }
    };
  }, [backgroundImage, previousObjectUrl]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 relative z-10">
       {/* Container for the glassmorphic effect */}
      <div className="glassmorphic p-6 md:p-10 w-full max-w-md text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
          ImageCanvas
        </h1>
        <p className="text-muted-foreground mb-8 text-base md:text-lg">
          Upload or capture an image to set as your background.
        </p>
        <ImageSelector onImageSelect={handleImageSelect} />
         {/* Display the upload message */}
        {uploadMessage && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400 font-medium">
            {uploadMessage}
          </p>
        )}
      </div>
    </main>
  );
}
