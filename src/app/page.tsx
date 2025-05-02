
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

  const handleImageSelect = useCallback((dataUrl: string, fileName: string = "Image uploaded") => {
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

        // Reset comparison related states if a new image is added
        setErrorMessage(null);
        setAnalysisDifferences(null);
        setShowResultsPopup(false); // Hide results popup if open

        // Check if both images are now selected AFTER updating state
        // Don't automatically trigger compare, wait for button click
        // if (firstEmptyIndex === 0 && prevUrls[1] !== null) {
        //    // Both images are selected
        // } else if (firstEmptyIndex === 1 && prevUrls[0] !== null) {
        //     // Both images are selected
        // }

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
      // data URIs are already stored in imageUrls
      const dataUri1 = imageUrls[0]!;
      const dataUri2 = imageUrls[1]!;

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
        errorDesc = error.message;
      }
      setErrorMessage(`Analysis Failed: ${errorDesc}`);
      toast({
        title: "Analysis Failed",
        description: errorDesc,
        variant: "destructive",
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
