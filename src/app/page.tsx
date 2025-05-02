
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ImageSelector from '@/components/image-selector';
import LoadingPopup from '@/components/loading-popup';
import ResultsPopup from '@/components/results-popup'; // Import the updated component
import { Button } from '@/components/ui/button';
import { X, RefreshCw, CheckSquare } from 'lucide-react';
import Image from 'next/image';
import { compareImages } from '@/ai/flows/compare-images-flow'; // Import the AI flow
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { toast } = useToast();
  // State for the two selected image URLs (now directly data URIs)
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null]);
  const [imageFileNames, setImageFileNames] = useState<(string | null)[]>([null, null]);
  // State to control the loading popup visibility
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to hold the analysis results (list of differences)
  const [analysisDifferences, setAnalysisDifferences] = useState<string[] | null>(null);
  // State to control the results popup visibility using AlertDialog's state
  const [showResultsPopup, setShowResultsPopup] = useState<boolean>(false);
  // State for error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function to convert potential blob URL to data URI (if needed, else returns original)
  // This is kept simple and assumes input might be blob or data URI already
  const ensureDataUri = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) {
      return url; // Already a data URI
    }
    // Basic check if it might be a blob URL - you might need a more robust check
    if (url.startsWith('blob:')) {
      console.warn('Received blob URL, attempting conversion. Direct data URI is preferred.');
      try {
        // Use fetch within the client-side context where it's valid
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        const blob = await response.blob();
        // Revoke the blob URL after fetching to free up resources
        URL.revokeObjectURL(url);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error converting blob URL to data URI:", error);
        toast({
          title: "Image Conversion Error",
          description: "Could not process the image from the camera capture.",
          variant: "destructive",
        });
        return null; // Return null on conversion failure
      }
    }
    // If it's neither, return null or handle as an error depending on expected inputs
    console.warn('Received URL is not a data URI or recognized blob URL:', url.substring(0, 100));
    // Assuming it SHOULD be a data URI if not a blob, treat as error or invalid input
     toast({
          title: "Invalid Image Data",
          description: "Received an unexpected image format.",
          variant: "destructive",
        });
    return null;
  };


  const handleImageSelect = useCallback((dataUrl: string, fileName: string = "Image uploaded") => {
    setImageUrls((prevUrls) => {
      const firstEmptyIndex = prevUrls.findIndex(url => url === null);
      if (firstEmptyIndex !== -1) {
        const newUrls = [...prevUrls];
        newUrls[firstEmptyIndex] = dataUrl;

        // Update file names
        setImageFileNames(prevNames => {
          const newNames = [...prevNames];
          // Ensure a generic name if fileName is empty or undefined
          newNames[firstEmptyIndex] = fileName || `Image ${firstEmptyIndex + 1}`;
          return newNames;
        });

        // Reset comparison related states if a new image is added
        setErrorMessage(null);
        setAnalysisDifferences(null);
        setShowResultsPopup(false); // Hide results popup if open

        // Check if both images are now selected AFTER updating state
        const bothSelected = newUrls[0] !== null && newUrls[1] !== null;
        if (bothSelected) {
          console.log("Both images selected, ready for comparison.");
        }

        return newUrls;
      }

      // If both slots are filled, show a message
      toast({
        title: "Slots Full",
        description: "Remove an image to add a new one.",
        variant: "destructive",
      });
      return prevUrls;
    });
    // Clear error message when a new image is successfully selected
    if (imageUrls.findIndex(url => url === null) !== -1) {
       setErrorMessage(null);
    }
  }, [toast, imageUrls]); // Added imageUrls dependency


  const handleRemoveImage = (index: number) => {
     setImageUrls((prevUrls) => {
       const newUrls = [...prevUrls];
       newUrls[index] = null;
       return newUrls;
     });
     setImageFileNames(prevNames => {
        const newNames = [...prevNames];
        newNames[index] = null;
        return newNames;
    });
     setAnalysisDifferences(null); // Clear results if an image is removed
     setShowResultsPopup(false); // Hide results popup
     setErrorMessage(null); // Clear errors
     setIsLoading(false); // Stop loading if it was in progress
  };

  const handleCompareImages = async () => {
    // Ensure both images are selected
    if (!imageUrls[0] || !imageUrls[1]) {
       setErrorMessage("Please select two images before comparing.");
       toast({
          title: "Missing Images",
          description: "Please select two images to compare.",
          variant: "destructive",
       });
      return;
    }

    setIsLoading(true); // Start loading animation
    setErrorMessage(null); // Clear previous errors
    setAnalysisDifferences(null);
    setShowResultsPopup(false); // Ensure results popup is hidden initially

    try {
      // Ensure both URLs are valid data URIs before sending to the AI
      // This ensures blob URLs are converted *before* sending to the server-side flow
      const dataUri1 = await ensureDataUri(imageUrls[0]);
      const dataUri2 = await ensureDataUri(imageUrls[1]);

      if (!dataUri1 || !dataUri2) {
          throw new Error("One or both images could not be processed. Please try re-uploading.");
      }


      // Call the AI flow
      console.log('Calling AI flow...'); // Log before calling
      const result = await compareImages({
        image1DataUri: dataUri1,
        image2DataUri: dataUri2,
      });
       console.log('AI flow completed, result:', result); // Log after calling

      setAnalysisDifferences(result.differences); // Use the 'differences' field
      setShowResultsPopup(true); // Show the results popup

    } catch (error) {
      console.error("Error comparing images:", error);
      let errorDesc = 'An unexpected error occurred during analysis.';
      if (error instanceof Error) {
        // Check for specific Genkit/API errors if possible
        if (error.message.includes('SAFETY')) {
             errorDesc = 'The analysis could not be completed due to safety restrictions. Please try with different images.';
        } else if (error.message.includes('API key not valid')) {
             errorDesc = 'Invalid API Key. Please check your configuration.';
        }
         else {
             errorDesc = error.message;
         }
      }
      setErrorMessage(`Analysis Failed: ${errorDesc}`);
      toast({
        title: "Analysis Failed",
        description: errorDesc,
        variant: "destructive",
        duration: 9000, // Show error longer
      });
      // Reset potentially inconsistent state on error
      setShowResultsPopup(false);
      setAnalysisDifferences(null);
      // Keep images loaded on error to allow retrying comparison
    } finally {
      console.log('Setting isLoading to false'); // Log before setting loading false
      setIsLoading(false); // Stop loading regardless of success/failure
    }
  };


  const handleReset = () => {
    // Reset state
    setImageUrls([null, null]);
    setImageFileNames([null, null]);
    setIsLoading(false);
    setAnalysisDifferences(null);
    setShowResultsPopup(false); // Hide results popup on reset
    setErrorMessage(null);
  };


  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 relative z-10 overflow-hidden">
       {/* Apply entrance animation here */}
       <div className="glassmorphic p-6 md:p-10 w-full max-w-xl text-center relative animate-fade-slide-in">
         {isLoading ? (
           // Show loading popup only when isLoading is true
           <LoadingPopup imageUrl={imageUrls[0] || imageUrls[1] || '/placeholder.png'} message="Magic is happening..." />
         ) : (
           // Show image selection UI when not loading
           <>
             <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
               Spot the Difference AI ✨ {/* Added sparkle emoji */}
             </h1>
             <p className="text-muted-foreground mb-8 text-base md:text-lg">
               Select or capture two images. Our AI will find the changes!
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"> {/* Increased gap */}
               {[0, 1].map((index) => (
                 <div key={index} className="border-2 border-dashed border-border/50 rounded-lg p-4 flex flex-col items-center justify-center aspect-square relative bg-background/40 hover:border-accent transition-colors duration-300 group"> {/* Enhanced styling */}
                   {imageUrls[index] ? (
                     <>
                       <Image
                         src={imageUrls[index]!}
                         alt={`Selected image ${index + 1}`}
                         width={150}
                         height={150}
                         className="object-contain rounded-md mb-3 shadow-md" {/* Added shadow */}
                          data-ai-hint="abstract comparison"
                       />
                        {/* Updated to show file name consistently */}
                        <p className="text-sm text-foreground truncate w-full px-2 font-medium" title={imageFileNames[index] || ''}>
                             {imageFileNames[index] || `Image ${index + 1}`}
                        </p>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="absolute top-2 right-2 h-7 w-7 bg-destructive/80 text-destructive-foreground hover:bg-destructive rounded-full transition-all" // Rounded button
                         onClick={() => handleRemoveImage(index)}
                         aria-label={`Remove image ${index + 1}`}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </>
                   ) : (
                      <div className="text-center text-muted-foreground group-hover:text-accent transition-colors"> {/* Hover effect */}
                         <p className="font-semibold">Image {index + 1}</p>
                         <p className="text-xs mt-1">(Upload or Capture)</p>
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
               <p className="mt-4 text-sm text-destructive dark:text-red-400 font-medium"> {/* Adjusted dark mode color */}
                 {errorMessage}
               </p>
             )}

             {/* Buttons container - centered and spaced */}
             <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                {/* Show Compare button only when both images are selected and not loading */}
                 {imageUrls[0] && imageUrls[1] && !isLoading && (
                     <Button
                       onClick={handleCompareImages}
                       className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105" // Added effects
                     >
                         <CheckSquare className="mr-2 h-4 w-4" /> Compare Images
                     </Button>
                 )}

                 {/* Show Reset button if any image is selected OR if results are shown */}
                 {(imageUrls.some(url => url !== null) || analysisDifferences !== null) && !isLoading && ( // Also show if results are present
                     <Button
                       onClick={handleReset}
                       variant="outline"
                       className="w-full sm:w-auto border-border/70 hover:border-foreground transition-colors" // Subtle styling
                     >
                         <RefreshCw className="mr-2 h-4 w-4" /> Reset
                     </Button>
                 )}
             </div>

           </>
         )}
       </div>
         {/* Render ResultsPopup outside the main conditional block, controlled by state */}
         {/* Ensure results popup appears even if isLoading becomes true briefly after results */}
         {(analysisDifferences !== null && imageUrls[0] && imageUrls[1]) && (
              <ResultsPopup
                 results={analysisDifferences || []} // Ensure results is always an array
                 onClose={handleReset} // Reset when closing the results
                 image1Url={imageUrls[0]!}
                 image2Url={imageUrls[1]!}
                 open={showResultsPopup}
                 setOpen={setShowResultsPopup}
             />
         )}
     </main>
  );
}
