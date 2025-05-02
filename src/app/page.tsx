
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ImageSelector from '@/components/image-selector';
import LoadingPopup from '@/components/loading-popup';
import ResultsPopup from '@/components/results-popup'; // Import the new component
import { Button } from '@/components/ui/button';
import { X, RefreshCw, CheckSquare } from 'lucide-react'; // Added CheckSquare for Compare button
import Image from 'next/image';
import { compareImages } from '@/ai/flows/compare-images-flow'; // Import the AI flow
import { useToast } from '@/hooks/use-toast';

// Removed blobUrlToDataUri function - no longer needed

export default function Home() {
  const { toast } = useToast();
  // State for the two selected image URLs (now directly data URIs)
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null]);
  const [imageFileNames, setImageFileNames] = useState<(string | null)[]>([null, null]);
  // State to control the loading popup visibility
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to hold the analysis results (list of missing objects)
  const [analysisResult, setAnalysisResult] = useState<string[] | null>(null);
  // State to control the results popup visibility
  const [showResults, setShowResults] = useState<boolean>(false);
  // Removed currentObjectUrls state - no longer needed
  // State for error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageSelect = useCallback((dataUrl: string, fileName: string = "Image uploaded") => {
    // No need for added flag or firstEmptyIndex logic here, handled in setter
    setImageUrls((prevUrls) => {
      const firstEmptyIndex = prevUrls.findIndex(url => url === null);
      if (firstEmptyIndex !== -1) {
        const newUrls = [...prevUrls];
        newUrls[firstEmptyIndex] = dataUrl;

        // Update file names
        setImageFileNames(prevNames => {
          const newNames = [...prevNames];
          newNames[firstEmptyIndex] = fileName;
          return newNames;
        });

        // If this is the second image, start loading/analysis immediately
        if (prevUrls.filter(Boolean).length === 1 && newUrls.filter(Boolean).length === 2) {
          setIsLoading(true); // Start loading animation
          setErrorMessage(null); // Clear previous errors
          setAnalysisResult(null);
          setShowResults(false);
        }

        return newUrls;
      }

      // If both slots are filled, show a message
      toast({
        title: "Slots Full",
        description: "Remove an image to add a new one.",
        variant: "destructive",
      });
      // No need to revoke URL here as we are using data URIs
      return prevUrls;
    });
    // Clear error message when a new image is successfully selected
    if (imageUrls.findIndex(url => url === null) !== -1) {
       setErrorMessage(null);
    }
  }, [toast, imageUrls]); // Added imageUrls dependency for checking slots

  // Automatically trigger comparison when both images are set and loading starts
  useEffect(() => {
    if (isLoading && imageUrls[0] && imageUrls[1]) {
      // Define the async function inside useEffect
      const triggerComparison = async () => {
        try {
          // data URIs are already stored in imageUrls
          const dataUri1 = imageUrls[0]!;
          const dataUri2 = imageUrls[1]!;

          // Call the AI flow
          const result = await compareImages({
            image1DataUri: dataUri1,
            image2DataUri: dataUri2,
          });

          setAnalysisResult(result.missingObjects);
          setShowResults(true);

        } catch (error) {
          console.error("Error comparing images:", error);
          let errorDesc = 'An unexpected error occurred during analysis.';
          if (error instanceof Error) {
            errorDesc = error.message;
          }
          setErrorMessage(`Analysis Failed: ${errorDesc}`);
          toast({
            title: "Analysis Failed",
            description: errorDesc,
            variant: "destructive",
          });
          // Reset potentially inconsistent state on error
          setShowResults(false);
          setAnalysisResult(null);
          // Reset images if analysis fails to allow retrying
          setImageUrls([null, null]);
          setImageFileNames([null, null]);
        } finally {
          setIsLoading(false); // Stop loading regardless of success/failure
        }
      };

      // Call the async function
      triggerComparison();
    }
     // Ensure loading stops if images are removed during loading
    else if (isLoading && (!imageUrls[0] || !imageUrls[1])) {
       setIsLoading(false);
    }
  }, [isLoading, imageUrls, toast]); // Add dependencies

  const handleRemoveImage = (index: number) => {
     setImageUrls((prevUrls) => {
       const newUrls = [...prevUrls];
       // No need to revoke URL
       newUrls[index] = null;
       return newUrls;
     });
     setImageFileNames(prevNames => {
        const newNames = [...prevNames];
        newNames[index] = null;
        return newNames;
    });
     // No need to manage currentObjectUrls
     setAnalysisResult(null); // Clear results if an image is removed
     setShowResults(false);
     setErrorMessage(null); // Clear errors
     setIsLoading(false); // Stop loading if it was in progress
  };

  // handleCompareImages is no longer needed as comparison triggers automatically

  const handleReset = () => {
    // No need to revoke URLs
    // Reset state
    setImageUrls([null, null]);
    setImageFileNames([null, null]);
    // No need to reset currentObjectUrls
    setIsLoading(false);
    setAnalysisResult(null);
    setShowResults(false);
    setErrorMessage(null);
  };

  // Cleanup useEffect is no longer needed for revoking URLs

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 relative z-10">
      <div className="glassmorphic p-6 md:p-10 w-full max-w-xl text-center relative">
        {isLoading ? (
          // Show loading popup only when isLoading is true
          <LoadingPopup imageUrl={imageUrls[0] || imageUrls[1] || '/placeholder.png'} message="Magic is happening..." />
        ) : showResults && analysisResult ? (
           // Show results popup
            <ResultsPopup
                results={analysisResult}
                onClose={handleReset} // Reset when closing the results
                image1Url={imageUrls[0]!}
                image2Url={imageUrls[1]!}
            />
        ) : (
          // Show image selection UI
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Spot the Difference AI
            </h1>
            <p className="text-muted-foreground mb-8 text-base md:text-lg">
              Select two images to find the differences.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[0, 1].map((index) => (
                <div key={index} className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center aspect-square relative bg-background/30">
                  {imageUrls[index] ? (
                    <>
                      <Image
                        src={imageUrls[index]!}
                        alt={`Selected image ${index + 1}`}
                        width={150}
                        height={150}
                        className="object-contain rounded-md mb-2"
                         data-ai-hint="abstract comparison"
                      />
                       <p className="text-sm text-foreground truncate w-full px-2 font-medium" title={imageFileNames[index] || ''}>
                            {imageFileNames[index] || `Image ${index + 1}`}
                       </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                        onClick={() => handleRemoveImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                     <div className="text-center text-muted-foreground">
                        <p>Image {index + 1}</p>
                        <p className="text-xs">(Upload or Capture)</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

             {/* Show ImageSelector only if less than 2 images are selected */}
            {imageUrls.filter(url => url !== null).length < 2 && (
                <ImageSelector onImageSelect={handleImageSelect} />
            )}


            {errorMessage && (
              <p className="mt-4 text-sm text-destructive dark:text-destructive font-medium">
                {errorMessage}
              </p>
            )}

            {/* Buttons container */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* Compare button is removed as comparison is automatic */}

                {/* Show Reset button if any image is selected OR if results are shown */}
                {(imageUrls.some(url => url !== null) || showResults) && !isLoading && (
                    <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                )}
            </div>

          </>
        )}
      </div>
    </main>
  );
}
