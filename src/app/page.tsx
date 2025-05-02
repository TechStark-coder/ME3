
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ImageSelector from '@/components/image-selector'; // Re-enable ImageSelector for both buttons
import LoadingPopup from '@/components/loading-popup';
import ResultsPopup from '@/components/results-popup';
import { Button } from '@/components/ui/button';
import { X, RefreshCw, CheckSquare, UploadCloud } from 'lucide-react'; // Added UploadCloud
import Image from 'next/image';
import { compareImages } from '@/ai/flows/compare-images-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Import cn utility

// Helper function to read file as Data URL (moved here for drag/drop)
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export default function Home() {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null]);
  const [imageFileNames, setImageFileNames] = useState<(string | null)[]>([null, null]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisDifferences, setAnalysisDifferences] = useState<string[] | null>(null);
  const [showResultsPopup, setShowResultsPopup] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input
  const [isDraggingOver, setIsDraggingOver] = useState<[boolean, boolean]>([false, false]); // State for drag-over effect

  // Callback for when an image is selected (either via click, drag, camera, or explicit upload button)
  const handleImageSelect = useCallback((dataUrl: string | null, fileName: string = "Image uploaded") => {
    if (!dataUrl) {
         console.warn("handleImageSelect called with null dataUrl");
         toast({
           title: 'Image Error',
           description: 'Could not process the selected image.',
           variant: 'destructive',
         });
        return; // Early exit if dataUrl is null
    }

    setImageUrls((prevUrls) => {
        const firstEmptyIndex = prevUrls.findIndex(url => url === null);
        if (firstEmptyIndex !== -1) {
            const newUrls = [...prevUrls];
            newUrls[firstEmptyIndex] = dataUrl;

            setImageFileNames(prevNames => {
                const newNames = [...prevNames];
                newNames[firstEmptyIndex] = fileName;
                return newNames;
            });

            setErrorMessage(null);
            setAnalysisDifferences(null);
            setShowResultsPopup(false);
            // No longer trigger loading here, wait for compare button
            // setIsLoading(true);

            console.log("Image selected:", { index: firstEmptyIndex, name: fileName });
            if (newUrls[0] !== null && newUrls[1] !== null) {
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
        return prevUrls;
    });
  }, [toast]);


   // Helper function to convert blob URL to data URI
  async function blobUrlToDataUri(blobUrl: string): Promise<string | null> {
     if (typeof fetch === 'undefined') {
         console.error("Fetch API is not available in this environment.");
         toast({ title: 'Environment Error', description: 'Fetch API not available. Cannot process camera image.', variant: 'destructive' });
         return null;
     }

     if (!blobUrl.startsWith('blob:')) {
         console.warn("Attempted to convert non-blob URL:", blobUrl.substring(0, 100));
         if (blobUrl.startsWith('data:')) {
             return blobUrl;
         }
          toast({ title: 'Invalid URL', description: 'Expected a blob or data URL.', variant: 'destructive' });
          return null;
     }

     console.log("Fetching blob URL:", blobUrl.substring(0, 50));
     try {
         const response = await fetch(blobUrl);
         console.log(`Fetch response status for ${blobUrl.substring(0, 50)}: ${response.status}`);
         if (!response.ok) {
             let errorBody = '';
             try { errorBody = await response.text(); } catch { /* ignore */ }
             console.error(`Failed to fetch blob: ${response.status} ${response.statusText}. Body: ${errorBody.substring(0, 100)} (URL: ${blobUrl.substring(0, 50)})`);
             toast({ title: 'Fetch Error', description: `Failed to fetch blob: ${response.statusText}`, variant: 'destructive' });
             return null;
         }
         const blob = await response.blob();
         console.log(`Blob fetched, size: ${blob.size}, type: ${blob.type}`);

         return new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => {
                 console.log("FileReader finished reading.");
                 try {
                     URL.revokeObjectURL(blobUrl);
                     console.log("Blob URL revoked:", blobUrl.substring(0, 50));
                 } catch (revokeError) {
                     console.warn("Could not revoke blob URL (might already be revoked or invalid):", revokeError);
                 }
                resolve(reader.result as string);
             };
             reader.onerror = (error) => {
                 console.error("FileReader error:", error);
                 try {
                     URL.revokeObjectURL(blobUrl);
                     console.log("Blob URL revoked after FileReader error:", blobUrl.substring(0, 50));
                 } catch (revokeError) {
                     console.warn("Could not revoke blob URL after error:", revokeError);
                 }
                  toast({ title: 'Read Error', description: 'Failed to read blob data.', variant: 'destructive' });
                 reject(new Error("Failed to read blob data."));
             };
             reader.readAsDataURL(blob);
         });
     } catch (error) {
          console.error(`Error during blob fetch/conversion for ${blobUrl.substring(0, 50)}:`, error);
           try {
             URL.revokeObjectURL(blobUrl);
             console.log("Blob URL revoked after fetch/conversion error:", blobUrl.substring(0, 50));
         } catch (revokeError) {
             console.warn("Could not revoke blob URL after fetch error:", revokeError);
         }
          toast({ title: 'Conversion Error', description: `Error converting camera image: ${error instanceof Error ? error.message : String(error)}`, variant: 'destructive' });
         return null;
     }
  }


  // Helper function to ensure a URL is a data URI
  const ensureDataUri = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('blob:')) {
      console.log('Received blob URL, attempting conversion.');
       try {
           const dataUri = await blobUrlToDataUri(url);
           return dataUri; // Will be null if conversion failed
       } catch (error) {
           console.error("Error converting blob URL to data URI:", error);
            // Toast is already shown in blobUrlToDataUri on error
           return null;
       }
    }
    console.error('Received URL is not a data URI or recognized blob URL:', url.substring(0, 100));
     toast({
          title: "Invalid Image Data",
          description: "Received an unexpected image format. Please re-upload or recapture.",
          variant: "destructive",
        });
    return null;
  };


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
     setAnalysisDifferences(null);
     setShowResultsPopup(false);
     setErrorMessage(null);
     setIsLoading(false); // Stop loading if an image is removed
     console.log(`Image removed from slot ${index + 1}`);
  };

  // Function to trigger comparison
  const handleCompareImages = async () => {
    if (!imageUrls[0] || !imageUrls[1]) {
       setErrorMessage("Please select two images before comparing.");
       toast({
          title: "Missing Images",
          description: "Please select two images to compare.",
          variant: "destructive",
       });
       // Do not set isLoading here, comparison didn't start
      return;
    }

    setIsLoading(true); // Set loading state when comparison starts
    setErrorMessage(null);
    setAnalysisDifferences(null);
    setShowResultsPopup(false);
    console.log('Starting image comparison process...');

    try {
      console.log('Ensuring data URIs...');
      const dataUri1 = await ensureDataUri(imageUrls[0]);
      const dataUri2 = await ensureDataUri(imageUrls[1]);
      console.log('Data URI check complete.');

      if (!dataUri1 || !dataUri2) {
          console.error("Data URI conversion/validation failed for one or both images.");
           setErrorMessage("One or both images could not be processed. Please try re-uploading or recapturing.");
           // Toast is likely already shown by ensureDataUri/blobUrlToDataUri
           setIsLoading(false);
          return;
      }

      console.log('Calling AI flow (compareImages)...');
      const result = await compareImages({
        image1DataUri: dataUri1,
        image2DataUri: dataUri2,
      });
       console.log('AI comparison completed, result:', result);

      if (!result || !Array.isArray(result.differences)) {
          console.error('Invalid result structure from AI:', result);
          setErrorMessage('Received an invalid response from the AI analysis.');
          toast({
               title: "Analysis Error",
               description: "Received unexpected data from the analysis.",
               variant: "destructive",
           });
           setShowResultsPopup(false);
           setAnalysisDifferences(null);
           // Keep isLoading false as process finished (with error)
           setIsLoading(false);
          return;
      }

      setAnalysisDifferences(result.differences);
      setShowResultsPopup(true);
      console.log('Results popup set to show.');
       setIsLoading(false); // Comparison finished, stop loading

    } catch (error) {
      console.error("Error during image comparison:", error);
      let errorDesc = 'An unexpected error occurred during analysis.';
      if (error instanceof Error) {
        if (error.message.includes('SAFETY')) {
             errorDesc = 'The analysis could not be completed due to safety restrictions. Please try with different images.';
        } else if (error.message.includes('API key not valid')) {
             errorDesc = 'Invalid API Key. Please check your configuration.';
        } else if (error.message.includes('AI comparison failed')) {
             // Extract the specific reason if available from the flow
             errorDesc = error.message;
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
        duration: 9000,
      });
      setShowResultsPopup(false);
      setAnalysisDifferences(null);
       setIsLoading(false); // Ensure loading is stopped on error
    }
    // Removed finally block as isLoading is handled within try/catch
  };

  const handleReset = () => {
    setImageUrls([null, null]);
    setImageFileNames([null, null]);
    setIsLoading(false);
    setAnalysisDifferences(null);
    setShowResultsPopup(false);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
    console.log("Application state reset.");
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
    setIsDraggingOver(prev => {
      const newState: [boolean, boolean] = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(prev => {
      const newState: [boolean, boolean] = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(prev => {
      const newState: [boolean, boolean] = [...prev];
      newState[index] = false;
      return newState;
    });

    if (imageUrls[index] !== null) {
        toast({ title: "Slot Full", description: `Remove image ${index + 1} first.`, variant: "destructive" });
        return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        try {
            const dataUrl = await readFileAsDataURL(file);
            // Set the image in the specific dropped index if available, otherwise first empty
            const targetIndex = imageUrls[index] === null ? index : imageUrls.findIndex(url => url === null);
            if (targetIndex !== -1) {
                // Use handleImageSelect to manage state updates
                handleImageSelect(dataUrl, file.name);
            } else {
                toast({ title: "Slots Full", description: "Remove an image to add a new one.", variant: "destructive" });
            }

        } catch (error) {
            console.error("Error reading dropped file:", error);
            toast({ title: "Read Error", description: "Could not read the dropped file.", variant: "destructive" });
        }
    } else if (file) {
        toast({ title: "Invalid File Type", description: "Please drop an image file (e.g., JPG, PNG, WEBP).", variant: "destructive" });
    }
  };

  // --- File Input Handling ---
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        // Use the standard handleImageSelect to find the first empty slot
        handleImageSelect(dataUrl, file.name);
      } catch (error) {
        console.error("Error reading file:", error);
        toast({ title: "Read Error", description: "Could not read the selected file.", variant: "destructive" });
      }
    } else if (file) {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
    }
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  // Trigger hidden file input when a box is clicked
  const handleBoxClick = (index: number) => {
     if (imageUrls[index] === null && fileInputRef.current) {
         fileInputRef.current.click(); // Trigger file selection
     }
     // If the box already has an image, maybe prompt for removal or do nothing
  };

  // Determine button visibility
  const showCompareButton = imageUrls[0] !== null && imageUrls[1] !== null && !isLoading && !showResultsPopup; // Only show if both images selected, not loading, and results not shown
  const showResetButton = (imageUrls.some(url => url !== null) || showResultsPopup) && !isLoading;


  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 relative z-10 overflow-hidden">
       {/* Hidden file input */}
       <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            className="hidden"
            id="image-upload"
        />
       <div className="glassmorphic p-6 md:p-10 w-full max-w-xl text-center relative animate-fade-slide-in">
         {isLoading && !showResultsPopup ? ( // Show loading only when actively comparing and results aren't shown
             <LoadingPopup
                 imageUrl={imageUrls[0] || 'https://picsum.photos/200/200'} // Use a placeholder
                 message={"Magic is happening..."}
             />
         ) : ( // Render the main content if not loading OR if loading is finished (even if results popup is shown)
             <>
                 <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                   Spot the Difference AI ✨
                 </h1>
                 <p className="text-muted-foreground mb-8 text-base md:text-lg">
                   Drop, upload, or capture two images. Our AI will find the changes!
                 </p>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     {[0, 1].map((index) => (
                         <div
                             key={index}
                             className={cn(
                                 "border-2 border-dashed border-border/50 rounded-lg p-4 flex flex-col items-center justify-center aspect-square relative bg-background/40 transition-colors duration-300 group",
                                 imageUrls[index] === null ? 'cursor-pointer hover:border-accent hover:bg-accent/10' : '', // Clickable/hover styles only if empty
                                 isDraggingOver[index] ? 'border-primary bg-primary/10 scale-105 shadow-lg' : '' // Drag-over styles
                             )}
                             onClick={() => handleBoxClick(index)} // Handle click to upload
                             onDragOver={(e) => handleDragOver(e, index)}
                             onDragLeave={(e) => handleDragLeave(e, index)}
                             onDrop={(e) => handleDrop(e, index)}
                             aria-label={imageUrls[index] ? `Image ${index + 1}: ${imageFileNames[index] || ''}` : `Drop or click to upload Image ${index + 1}`}
                             role="button"
                             tabIndex={imageUrls[index] === null ? 0 : -1}
                         >
                             {imageUrls[index] ? (
                                 <>
                                     <Image
                                         src={imageUrls[index]!}
                                         alt={`Selected image ${index + 1}`}
                                         width={150}
                                         height={150}
                                         className="object-contain rounded-md mb-3 shadow-md"
                                         data-ai-hint="abstract comparison"
                                         onError={(e) => {
                                             console.error(`Error loading image ${index + 1} preview:`, e);
                                             toast({ title: "Image Load Error", description: `Could not display image ${index + 1}. It might be corrupted.`, variant: "destructive" });
                                             handleRemoveImage(index);
                                         }}
                                     />
                                     <p className="text-sm text-foreground truncate w-full px-2 font-medium" title={imageFileNames[index] || ''}>
                                         {imageFileNames[index] || `Image ${index + 1}`}
                                     </p>
                                     <Button
                                         variant="ghost"
                                         size="icon"
                                         className="absolute top-2 right-2 h-7 w-7 bg-destructive/80 text-destructive-foreground hover:bg-destructive rounded-full transition-all z-10" // Ensure button is clickable
                                         onClick={(e) => {
                                             e.stopPropagation(); // Prevent box click when removing
                                             handleRemoveImage(index);
                                         }}
                                         aria-label={`Remove image ${index + 1}`}
                                     >
                                         <X className="h-4 w-4" />
                                     </Button>
                                 </>
                             ) : (
                                 <div className="text-center text-muted-foreground group-hover:text-accent transition-colors pointer-events-none"> {/* Prevent text selection during drag */}
                                     <UploadCloud className="h-12 w-12 mx-auto mb-3" />
                                     <p className="font-semibold">Image {index + 1}</p>
                                     <p className="text-xs mt-1">(Drop, Click, or Capture)</p>
                                      {isDraggingOver[index] && <p className="text-xs mt-1 text-primary font-bold">Drop here!</p>}
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>

                  {/* Restore ImageSelector with both buttons */}
                 <ImageSelector
                     onImageSelect={handleImageSelect}
                     disabled={imageUrls[0] !== null && imageUrls[1] !== null} // Disable if both slots are full
                     showUploadOption={true} // Explicitly show upload option
                 />


                 {errorMessage && (
                     <p className="mt-4 text-sm text-destructive dark:text-red-400 font-medium">
                         {errorMessage}
                     </p>
                 )}

                 <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                      {/* Compare Button */}
                     {showCompareButton && (
                         <Button
                             onClick={handleCompareImages}
                             className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105"
                             disabled={isLoading} // Disable while loading
                         >
                             <CheckSquare className="mr-2 h-4 w-4" /> Compare Images
                         </Button>
                     )}
                      {/* Reset Button */}
                     {showResetButton && (
                         <Button
                             onClick={handleReset}
                             variant="outline"
                             className="w-full sm:w-auto border-border/70 hover:border-foreground transition-colors"
                             disabled={isLoading} // Disable while loading
                         >
                             <RefreshCw className="mr-2 h-4 w-4" /> Reset
                         </Button>
                     )}
                 </div>
             </>
         )}
       </div>

        {/* Results Popup - Render outside the main loading/content conditional */}
       {analysisDifferences !== null && imageUrls[0] && imageUrls[1] && (
           <ResultsPopup
               results={analysisDifferences}
               onClose={handleReset} // Reset state when closing the popup
               image1Url={imageUrls[0]}
               image2Url={imageUrls[1]}
               open={showResultsPopup} // Controlled by state
               setOpen={setShowResultsPopup} // Update state on open/close
           />
       )}
     </main>
  );
}
