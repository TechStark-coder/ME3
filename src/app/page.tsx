
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ImageSelector from '@/components/image-selector';
import LoadingPopup from '@/components/loading-popup';
import ResultsPopup from '@/components/results-popup'; // Import the new component
import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { compareImages } from '@/ai/flows/compare-images-flow'; // Import the AI flow
import { useToast } from '@/hooks/use-toast';

// Helper function to convert blob URL to data URI
async function blobUrlToDataUri(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
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
    setImageUrls((prevUrls) => {
      const firstEmptyIndex = prevUrls.findIndex(url => url === null);
      if (firstEmptyIndex !== -1) {
        const newUrls = [...prevUrls];
        newUrls[firstEmptyIndex] = imageUrl;

        // Revoke previous URL for this slot if necessary
        if (currentObjectUrls[firstEmptyIndex] && currentObjectUrls[firstEmptyIndex]?.startsWith('blob:')) {
          URL.revokeObjectURL(currentObjectUrls[firstEmptyIndex]!);
        }
        // Update current object URLs
        setCurrentObjectUrls(prevObjUrls => {
            const newObjUrls = [...prevObjUrls];
            newObjUrls[firstEmptyIndex] = imageUrl;
            return newObjUrls;
        });

         // Update file names
        setImageFileNames(prevNames => {
            const newNames = [...prevNames];
            newNames[firstEmptyIndex] = fileName || (imageUrl.startsWith('blob:') ? 'captured_image.jpg' : 'uploaded_image');
            return newNames;
        });


        return newUrls;
      }
      // If both slots are filled, potentially replace the first one or show a message
      toast({
        title: "Slots Full",
        description: "Remove an image to add a new one.",
        variant: "destructive",
      });
      // Revoke the URL if it wasn't used
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      return prevUrls;
    });
    setErrorMessage(null); // Clear previous errors
  }, [currentObjectUrls, toast]); // Added toast to dependencies

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
    if (imageUrls.some(url => url === null)) {
      setErrorMessage("Please select two images to compare.");
      toast({
        title: "Missing Images",
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
      // Convert blob URLs to data URIs
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
                onClose={() => setShowResults(false)}
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
                       <p className="text-xs text-muted-foreground truncate w-full px-2" title={imageFileNames[index] || ''}>
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

            {imageUrls.filter(url => url !== null).length < 2 && (
                <ImageSelector onImageSelect={handleImageSelect} />
            )}


            {errorMessage && (
              <p className="mt-4 text-sm text-destructive dark:text-destructive font-medium">
                {errorMessage}
              </p>
            )}

            {imageUrls[0] && imageUrls[1] && !isLoading && (
              <div className="mt-6 flex gap-4 justify-center">
                <Button onClick={handleCompareImages} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Compare Images
                </Button>
                <Button onClick={handleReset} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> Start Over
                </Button>
              </div>
            )}
             {/* Button to start over if only one image is selected */}
            {imageUrls.filter(url => url !== null).length > 0 && !(imageUrls[0] && imageUrls[1]) && (
                <Button onClick={handleReset} variant="outline" className="mt-6">
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset
                </Button>
            )}

          </>
        )}
      </div>
    </main>
  );
}
