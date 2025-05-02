
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


   // Helper function to convert blob URL to data URI
  async function blobUrlToDataUri(blobUrl: string): Promise<string> {
      // Check if fetch is available
     if (typeof fetch === 'undefined') {
         console.error("Fetch API is not available in this environment.");
         throw new Error("Fetch API not available. Cannot process camera image.");
     }

     // Added check for blob URL prefix just in case non-blob URLs are passed
     if (!blobUrl.startsWith('blob:')) {
         console.warn("Attempted to convert non-blob URL:", blobUrl.substring(0, 100));
         // Return the original URL if it's not a blob URL, assuming it might be a data URI already
         // Or throw an error if only blob URLs are expected here
         // For now, let's assume it might be a data URI and return it.
         // If this function *only* expects blob URLs, throwing an error might be better.
         return blobUrl;
         // throw new Error("Invalid URL: Expected a blob URL.");
     }


      console.log("Fetching blob URL:", blobUrl.substring(0, 50)); // Log start
     try {
         const response = await fetch(blobUrl);
         console.log(`Fetch response status for ${blobUrl.substring(0, 50)}: ${response.status}`); // Log status
         if (!response.ok) {
             console.error(`Failed to fetch blob: ${response.statusText} (URL: ${blobUrl.substring(0, 50)})`); // Log error details
            throw new Error(`Failed to fetch blob: ${response.statusText}`);
         }
         const blob = await response.blob();
         console.log(`Blob fetched, size: ${blob.size}, type: ${blob.type}`); // Log blob details

         // It's crucial to revoke the object URL *after* you're done with the blob
         // However, ensure it's not needed elsewhere before revoking.
         // Deferring revoke until after FileReader is done might be safer in complex scenarios,
         // but often it's okay here if the blob is immediately processed.
         try {
             URL.revokeObjectURL(blobUrl);
             console.log("Blob URL revoked:", blobUrl.substring(0, 50));
         } catch (revokeError) {
             console.warn("Could not revoke blob URL (might already be revoked or invalid):", revokeError);
         }

         return new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => {
                 console.log("FileReader finished reading."); // Log success
                resolve(reader.result as string);
             };
             reader.onerror = (error) => {
                 console.error("FileReader error:", error); // Log error
                 reject(new Error("Failed to read blob data."));
             };
             reader.readAsDataURL(blob);
         });
     } catch (error) {
          console.error(`Error during blob fetch/conversion for ${blobUrl.substring(0, 50)}:`, error); // Log detailed error
          // Re-throw a more specific error or handle it
          throw new Error(`Error converting camera image: ${error instanceof Error ? error.message : String(error)}`);
     }
  }


  // Helper function to ensure a URL is a data URI
  const ensureDataUri = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) {
      return url; // Already a data URI
    }
    if (url.startsWith('blob:')) {
      console.warn('Received blob URL, attempting conversion. Direct data URI is preferred.');
       try {
           const dataUri = await blobUrlToDataUri(url);
           return dataUri;
       } catch (error) {
           console.error("Error converting blob URL to data URI:", error);
           toast({
               title: "Image Conversion Error",
               description: `Could not process the camera image. ${error instanceof Error ? error.message : String(error)}`,
               variant: "destructive",
           });
           return null; // Return null on conversion failure
       }
    }
     // If it's neither, log a warning and return null or throw an error
    console.warn('Received URL is not a data URI or recognized blob URL:', url.substring(0, 100));
     toast({
          title: "Invalid Image Data",
          description: "Received an unexpected image format. Please re-upload or recapture.",
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

            setImageFileNames(prevNames => {
                const newNames = [...prevNames];
                 newNames[firstEmptyIndex] = fileName; // Use the actual file name or "captured_image.jpg"
                return newNames;
            });

            setErrorMessage(null); // Clear previous errors
            setAnalysisDifferences(null); // Reset previous analysis
            setShowResultsPopup(false); // Hide results popup

            const bothSelected = newUrls[0] !== null && newUrls[1] !== null;
            // Remove automatic loading trigger from here
            setIsLoading(false);

            console.log("Image selected:", { index: firstEmptyIndex, name: fileName });
             if (bothSelected) {
                console.log("Both image slots are now filled. Ready for comparison.");
             } else {
                 console.log("One image slot filled.");
             }

            return newUrls;
        }

        toast({
            title: "Slots Full",
            description: "Remove an image to add a new one.",
            variant: "destructive",
        });
        return prevUrls; // Return previous state if no slot was available
    });
 }, [toast]);


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
     console.log(`Image removed from slot ${index + 1}`);
  };

  // Function to trigger comparison
  const handleCompareImages = async () => {
    // Ensure both images are selected
    if (!imageUrls[0] || !imageUrls[1]) {
       setErrorMessage("Please select two images before comparing.");
       toast({
          title: "Missing Images",
          description: "Please select two images to compare.",
          variant: "destructive",
       });
       setIsLoading(false); // Should already be false, but ensure it
      return;
    }

    setIsLoading(true); // Start loading FOR comparison
    setErrorMessage(null); // Clear previous errors
    setAnalysisDifferences(null);
    setShowResultsPopup(false); // Ensure results popup is hidden initially
    console.log('Starting image comparison process...');

    try {
      // Ensure both URLs are valid data URIs before sending to the AI
      console.log('Ensuring data URIs...');
      const dataUri1 = await ensureDataUri(imageUrls[0]);
      const dataUri2 = await ensureDataUri(imageUrls[1]);
      console.log('Data URI check complete.');


      if (!dataUri1 || !dataUri2) {
          console.error("Data URI conversion/validation failed for one or both images.");
           // Don't throw, use toast and set state
           setErrorMessage("One or both images could not be processed. Please try re-uploading or recapturing.");
           toast({
                title: "Image Processing Error",
                description: "One or both images could not be processed.",
                variant: "destructive",
            });
           setIsLoading(false); // Stop loading on error
          return; // Exit the function
      }


      // Call the AI flow
      console.log('Calling AI flow (compareImages)...'); // Log before calling
      const result = await compareImages({
        image1DataUri: dataUri1,
        image2DataUri: dataUri2,
      });
       console.log('AI comparison completed, result:', result); // Log after calling

      if (!result || !Array.isArray(result.differences)) {
          console.error('Invalid result structure from AI:', result);
          throw new Error('Received an invalid response from the AI analysis.'); // Throw for unexpected structure
      }


      setAnalysisDifferences(result.differences); // Use the 'differences' field
      setShowResultsPopup(true); // Show the results popup
      console.log('Results popup set to show.');

    } catch (error) {
      console.error("Error during image comparison:", error);
      let errorDesc = 'An unexpected error occurred during analysis.';
      if (error instanceof Error) {
        // Check for specific Genkit/API errors if possible
        if (error.message.includes('SAFETY')) {
             errorDesc = 'The analysis could not be completed due to safety restrictions. Please try with different images.';
        } else if (error.message.includes('API key not valid')) {
             errorDesc = 'Invalid API Key. Please check your configuration.';
        }
         else {
             errorDesc = error.message; // Use the actual error message
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
      console.log('Comparison process finished, setting isLoading to false'); // Log before setting loading false
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
    console.log("Application state reset.");
  };


  // Determine if the compare button should be shown
  const showCompareButton = imageUrls[0] !== null && imageUrls[1] !== null && !isLoading && !showResultsPopup;
  // Determine if the reset button should be shown
  const showResetButton = (imageUrls.some(url => url !== null) || showResultsPopup) && !isLoading;

  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 relative z-10 overflow-hidden">
       {/* Apply entrance animation here */}
       <div className="glassmorphic p-6 md:p-10 w-full max-w-xl text-center relative animate-fade-slide-in">
         {isLoading && !showResultsPopup ? ( // Show loading only when actively comparing and results aren't shown
           <LoadingPopup
                // Show the first image selected while loading, or placeholder if none yet
                 imageUrl={imageUrls[0] || '/placeholder.png'} // Fallback needed if image 1 might not exist
                 message={"Magic is happening..."}
            />
         ) : (
           // Show image selection UI when not loading OR when results are ready
           <>
             <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
               Spot the Difference AI ✨
             </h1>
             <p className="text-muted-foreground mb-8 text-base md:text-lg">
               Select or capture two images. Our AI will find the changes!
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               {[0, 1].map((index) => (
                 <div key={index} className="border-2 border-dashed border-border/50 rounded-lg p-4 flex flex-col items-center justify-center aspect-square relative bg-background/40 hover:border-accent transition-colors duration-300 group">
                   {imageUrls[index] ? (
                     <>
                       <Image
                         src={imageUrls[index]!}
                         alt={`Selected image ${index + 1}`}
                         width={150}
                         height={150}
                         className="object-contain rounded-md mb-3 shadow-md"
                         data-ai-hint="abstract comparison"
                         onError={(e) => { console.error(`Error loading image ${index + 1}:`, e); handleRemoveImage(index); }}
                       />
                        <p className="text-sm text-foreground truncate w-full px-2 font-medium" title={imageFileNames[index] || ''}>
                           {/* Show the actual file name or "captured_image.jpg" */}
                           {imageFileNames[index] || `Image ${index + 1}`}
                        </p>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="absolute top-2 right-2 h-7 w-7 bg-destructive/80 text-destructive-foreground hover:bg-destructive rounded-full transition-all"
                         onClick={() => handleRemoveImage(index)}
                         aria-label={`Remove image ${index + 1}`}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </>
                   ) : (
                      <div className="text-center text-muted-foreground group-hover:text-accent transition-colors">
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
               <p className="mt-4 text-sm text-destructive dark:text-red-400 font-medium">
                 {errorMessage}
               </p>
             )}

             {/* Buttons container - centered and spaced */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                 {/* Show Compare button only when both images are selected and not currently loading a result */}
                 {showCompareButton && (
                     <Button
                       onClick={handleCompareImages}
                       className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105"
                       disabled={isLoading} // Should be false here based on showCompareButton logic, but good practice
                     >
                         <CheckSquare className="mr-2 h-4 w-4" /> Compare Images
                     </Button>
                 )}

                 {/* Show Reset button if any image is selected OR if results are shown, but not during active loading */}
                 {showResetButton && (
                     <Button
                       onClick={handleReset}
                       variant="outline"
                       className="w-full sm:w-auto border-border/70 hover:border-foreground transition-colors"
                       disabled={isLoading} // Disable reset during comparison loading
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
          {showResultsPopup && analysisDifferences !== null && imageUrls[0] && imageUrls[1] && (
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
