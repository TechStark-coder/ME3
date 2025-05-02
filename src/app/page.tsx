
"use client";

import React, { useState, useEffect } from 'react';
import ImageSelector from '@/components/image-selector';
import LoadingPopup from '@/components/loading-popup'; // Import the new component

export default function Home() {
  // State for the selected image URL (blob or data URL)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  // State to control the loading popup visibility
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to hold the message about the uploaded image (optional, maybe use in popup)
  const [uploadMessage, setUploadMessage] = useState<string>('');
  // Store the object URL to revoke it later
  const [currentObjectUrl, setCurrentObjectUrl] = useState<string | null>(null);

  const handleImageSelect = (imageUrl: string, fileName?: string) => {
    // Revoke the previous object URL if it exists and is a blob URL
    if (currentObjectUrl && currentObjectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentObjectUrl);
    }

    setSelectedImageUrl(imageUrl);
    setIsLoading(true); // Show the loading popup
    setCurrentObjectUrl(imageUrl); // Store the new URL

    // Set the upload message (can be passed to LoadingPopup if needed)
    if (fileName) {
      setUploadMessage(`Processing "${fileName}"...`);
    } else {
      setUploadMessage('Processing captured image...');
    }

    // Simulate AI analysis time (replace with actual AI call)
    setTimeout(() => {
      setIsLoading(false);
      // Optionally clear message or show results here
      setUploadMessage(fileName ? `Analysis complete for "${fileName}"!` : 'Analysis complete!');
       // Keep the selected image URL available if needed for display after loading
       // setSelectedImageUrl(null); // Uncomment if you want to clear the image after loading
       // if (imageUrl.startsWith('blob:')) {
       //   URL.revokeObjectURL(imageUrl); // Revoke URL after loading simulation
       // }
       // setCurrentObjectUrl(null);
    }, 5000); // Simulate 5 seconds loading
  };

  // Cleanup object URL on component unmount or when a new image is selected
  useEffect(() => {
    return () => {
      if (currentObjectUrl && currentObjectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [currentObjectUrl]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 relative z-10">
       {/* Container for the glassmorphic effect */}
      <div className="glassmorphic p-6 md:p-10 w-full max-w-md text-center relative"> {/* Added relative positioning */}
        {isLoading && selectedImageUrl ? (
          <LoadingPopup imageUrl={selectedImageUrl} message="Magic is happening..." />
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              ImageCanvas AI
            </h1>
            <p className="text-muted-foreground mb-8 text-base md:text-lg">
              Upload or capture an image for AI analysis.
            </p>
            <ImageSelector onImageSelect={handleImageSelect} />
            {/* Display a message after loading completes */}
            {!isLoading && uploadMessage && (
              <p className="mt-4 text-sm text-green-600 dark:text-green-400 font-medium">
                {uploadMessage}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
