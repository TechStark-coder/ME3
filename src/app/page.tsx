
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

// Helper function to convert blob URL or return data URI
async function blobUrlToDataUri(url: string): Promise<string> {
  // Check if it's already a data URI
  if (url.startsWith('data:')) {
    return url;
  }

  // If it's a blob URL, fetch and convert
  if (url.startsWith('blob:')) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  resolve(reader.result);
              } else {
                  reject(new Error('Failed to read blob as data URL.'));
              }
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
         console.error("Error fetching blob URL:", error);
         // Provide a more specific error message
         throw new Error(`Network error or issue fetching image data from URL. Please try uploading again.`);
      }
  }

  // If it's neither, throw an error or handle as appropriate
  throw new Error(`Invalid URL type: ${url.substring(0, 30)}...`);
}


export default function Home() {
  const { toast } = useToast();
  // State for the two selected image URLs (blob or data URLs)
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null]);
  const [imageFileNames, setImageFileNames] = useState<(string | null)[]>([null, null]);
  // State to control the loading popup visibility
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to hold the analysis results (list of missing objects)
  const [analysisResult, setAnalysisResult] = useState<string[] | null>(null);
  // State to control the results popup visibility
  const [showResults, setShowResults] = useState<boolean>(false);
  // Store the object URLs to revoke them later
  const [currentObjectUrls, setCurrentObjectUrls] = useState<(string | null)[]>([null, null]);
  // State for error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const handleImageSelect = useCallback((imageUrl: string, fileName?: string) => {
    let added = false;
    let firstEmptyIndex = -1; // Keep track of the index where the image was added

    setImageUrls((prevUrls) => {
      firstEmptyIndex = prevUrls.findIndex(url => url === null);
      if (firstEmptyIndex !== -1) {
        const newUrls = [...prevUrls];
        newUrls[firstEmptyIndex] = imageUrl;
        added = true; // Mark as added

        // Revoke previous URL for this slot if necessary
        if (currentObjectUrls[firstEmptyIndex] && currentObjectUrls[firstEmptyIndex]?.startsWith('blob:')) {
          URL.revokeObjectURL(currentObjectUrls[firstEmptyIndex]!);
        }
        // Update current object URLs
        setCurrentObjectUrls(prevObjUrls => {
            const newObjUrls = [...prevObjUrls];
            newObjUrls[firstEmptyIndex] = imageUrl.startsWith('blob:') ? imageUrl : null; // Only store blob URLs for revocation
            return newObjUrls;
        });

         // Update file names
        setImageFileNames(prevNames => {
            const newNames = [...prevNames];
            newNames[firstEmptyIndex] = "Image uploaded"; // Set fixed name
            return newNames;
        });


        return newUrls;
      }
      // If both slots are filled, show a message
      toast({
        title: "Slots Full",
        description: "Remove an image to add a new one.",
        variant: "destructive",
      });
      // Revoke the URL if it wasn't used and is a blob URL
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      return prevUrls;
    });
    setErrorMessage(null); // Clear previous errors

  }, [currentObjectUrls, toast]);


  const handleRemoveImage = (index: number) => {
     setImageUrls((prevUrls) => {
       const newUrls = [...prevUrls];
       const urlToRemove = newUrls[index];
       if (urlToRemove && urlToRemove.startsWith('blob:')) {
         URL.revokeObjectURL(urlToRemove);
       }
       newUrls[index] = null;
       return newUrls;
     });
     setImageFileNames(prevNames => {
        const newNames = [...prevNames];
        newNames[index] = null;
        return newNames;
    });
     setCurrentObjectUrls(prevObjUrls => {
        const newObjUrls = [...prevObjUrls];
        newObjUrls[index] = null;
        return newObjUrls;
     });
     setAnalysisResult(null); // Clear results if an image is removed
     setShowResults(false);
     setErrorMessage(null); // Clear errors
  };

  const handleCompareImages = async () => {
    // Double check images are present before proceeding
    if (imageUrls.some(url => url === null)) {
      console.warn("Compare called but one or more images are missing.");
      toast({
        title: "Missing Image",
        description: "Please select two images before comparing.",
        variant: "destructive",
      });
      return;
    }


    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisResult(null);
    setShowResults(false);

    try {
      // Convert blob URLs to data URIs (or pass through existing data URIs)
      const dataUri1 = await blobUrlToDataUri(imageUrls[0]!);
      const dataUri2 = await blobUrlToDataUri(imageUrls[1]!);

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
    } finally {
      setIsLoading(false);
    }
  };

   const handleReset = () => {
    // Revoke URLs
    currentObjectUrls.forEach(url => {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    });
    // Reset state
    setImageUrls([null, null]);
    setImageFileNames([null, null]);
    setCurrentObjectUrls([null, null]);
    setIsLoading(false);
    setAnalysisResult(null);
    setShowResults(false);
    setErrorMessage(null);
  };


  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      currentObjectUrls.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [currentObjectUrls]);


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
              Upload or capture two images to find the differences.
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
                            {imageFileNames[index]}
                       </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                        onClick={() => handleRemoveImage(index)}
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
                {/* Show Compare button only when both images are selected and not loading/showing results */}
                {imageUrls[0] && imageUrls[1] && !isLoading && !showResults && (
                    <Button onClick={handleCompareImages} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                        <CheckSquare className="mr-2 h-4 w-4" /> Compare Images
                    </Button>
                )}

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

