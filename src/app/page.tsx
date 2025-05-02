
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ImageSelector from '@/components/image-selector';
import LoadingPopup from '@/components/loading-popup';
import ResultsPopup from '@/components/results-popup';
import { Button } from '@/components/ui/button';
import { X, RefreshCw, CheckSquare, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { compareImages } from '@/ai/flows/compare-images-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper function to read file as Data URL
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

// Helper function to convert blob URL to data URI
async function blobUrlToDataUri(blobUrl: string): Promise<string | null> {
  if (typeof fetch === 'undefined') {
    console.error("Fetch API is not available in this environment.");
    return null;
  }

  if (!blobUrl.startsWith('blob:')) {
    console.warn("Attempted to convert non-blob URL:", blobUrl.substring(0, 100));
    if (blobUrl.startsWith('data:')) {
      return blobUrl; // Already a data URL
    }
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
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
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
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error("FileReader did not return a string result."));
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        try {
          URL.revokeObjectURL(blobUrl);
          console.log("Blob URL revoked after FileReader error:", blobUrl.substring(0, 50));
        } catch (revokeError) {
          console.warn("Could not revoke blob URL after error:", revokeError);
        }
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
    return null; // Indicate failure
  }
}

// Helper function to ensure a URL is a data URI
const ensureDataUri = async (url: string | null, toast: ReturnType<typeof useToast>['toast']): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('blob:')) {
    console.log('Received blob URL, attempting conversion.');
    try {
      const dataUri = await blobUrlToDataUri(url);
      if (!dataUri) {
        toast({
          title: "Image Conversion Error",
          description: "Could not convert captured image data. Please try again.",
          variant: "destructive",
        });
      }
      return dataUri;
    } catch (error) {
      console.error("Error converting blob URL to data URI:", error);
      toast({
        title: "Image Conversion Error",
        description: `Failed to process captured image: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
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


export default function Home() {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null]);
  const [imageFileNames, setImageFileNames] = useState<(string | null)[]>([null, null]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisDifferences, setAnalysisDifferences] = useState<string[] | null>(null);
  const [showResultsPopup, setShowResultsPopup] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<[boolean, boolean]>([false, false]);

  // Callback for image selection
  const handleImageSelect = useCallback((dataUrl: string | null, fileName: string = "Image uploaded") => {
    if (!dataUrl) {
      console.warn("handleImageSelect called with null dataUrl");
      toast({
        title: 'Image Error',
        description: 'Could not process the selected image.',
        variant: 'destructive',
      });
      return;
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

        console.log("Image selected:", { index: firstEmptyIndex, name: fileName });
        if (newUrls[0] !== null && newUrls[1] !== null) {
            console.log("Both image slots filled. Ready for comparison.");
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
    setIsLoading(false);
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
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisDifferences(null);
    setShowResultsPopup(false);
    console.log('Starting image comparison process...');

    try {
      console.log('Ensuring data URIs...');
      const dataUri1 = await ensureDataUri(imageUrls[0], toast);
      const dataUri2 = await ensureDataUri(imageUrls[1], toast);
      console.log('Data URI check complete.');

      if (!dataUri1 || !dataUri2) {
        console.error("Data URI conversion/validation failed for one or both images.");
        setErrorMessage("One or both images could not be processed. Please try re-uploading or recapturing.");
        setIsLoading(false);
        return;
      }

      console.log('Calling AI flow (compareImages)...');
      // Add prefixes for logging if needed, but be careful with large data URIs
      // console.log('AI Input:', {
      //   image1DataUri: dataUri1.substring(0, 100) + '...',
      //   image2DataUri: dataUri2.substring(0, 100) + '...'
      // });
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
      } else {
        setAnalysisDifferences(result.differences);
        setShowResultsPopup(true);
        console.log('Results popup set to show.');
      }

    } catch (error: any) {
        console.error("Error during image comparison in page.tsx:", error);

        // Log detailed error information if available
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        // If the error has a cause property (common in newer Node/JS versions)
        if (error.cause) {
          console.error("Error cause:", error.cause);
        }

        let errorDesc = 'An unexpected error occurred during analysis.';
        if (error instanceof Error) {
            // More specific error checks based on the enhanced error from the flow
            if (error.message.includes('Network/API Key Issue suspected')) {
                errorDesc = 'Failed to connect to the AI service. Please check your network connection and API key.';
            } else if (error.message.includes('Model not found')) {
                errorDesc = 'The AI model specified is not available. Please contact support.';
            } else if (error.message.includes('SAFETY')) {
                errorDesc = 'Analysis blocked due to safety settings. Try different images.';
            } else if (error.message.includes('Invalid API Key')) {
                errorDesc = 'Invalid API Key provided. Please check configuration.';
            } else if (error.message.includes('AI comparison failed')) {
                // Use the message directly if it's from our flow wrapper
                errorDesc = error.message;
            } else {
                // Generic fallback for other Error instances
                errorDesc = error.message;
            }
        } else {
            // Handle non-Error objects being thrown
             errorDesc = `An unexpected error occurred: ${String(error)}`;
        }

        setErrorMessage(`Analysis Failed: ${errorDesc}`);
        toast({
            title: "Analysis Failed",
            description: errorDesc,
            variant: "destructive",
            duration: 9000, // Show longer for critical errors
        });
        setAnalysisDifferences(null);
        setShowResultsPopup(false);

    } finally {
      setIsLoading(false); // Ensure loading is stopped regardless of success or failure
      console.log('Image comparison process finished (or errored).');
    }
  };

  const handleReset = () => {
    setImageUrls([null, null]);
    setImageFileNames([null, null]);
    setIsLoading(false);
    setAnalysisDifferences(null);
    setShowResultsPopup(false);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    console.log("Application state reset.");
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
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
        const targetIndex = imageUrls[index] === null ? index : imageUrls.findIndex(url => url === null);
        if (targetIndex !== -1) {
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

  // File Input Handling
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        handleImageSelect(dataUrl, file.name);
      } catch (error) {
        console.error("Error reading file:", error);
        toast({ title: "Read Error", description: "Could not read the selected file.", variant: "destructive" });
      }
    } else if (file) {
      toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBoxClick = (index: number) => {
    if (imageUrls[index] === null && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Button visibility logic
  const showCompareButton = imageUrls[0] !== null && imageUrls[1] !== null && !isLoading && !showResultsPopup;
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
                 imageUrl={imageUrls[0] || 'https://picsum.photos/200/200'} // Use first image or placeholder
                 message={"Magic is happening..."}
             />
         ) : (
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
                                 imageUrls[index] === null ? 'cursor-pointer hover:border-accent hover:bg-accent/10' : '',
                                 isDraggingOver[index] ? 'border-primary bg-primary/10 scale-105 shadow-lg' : ''
                             )}
                             onClick={() => handleBoxClick(index)}
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
                                         className="absolute top-2 right-2 h-7 w-7 bg-destructive/80 text-destructive-foreground hover:bg-destructive rounded-full transition-all z-10"
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             handleRemoveImage(index);
                                         }}
                                         aria-label={`Remove image ${index + 1}`}
                                     >
                                         <X className="h-4 w-4" />
                                     </Button>
                                 </>
                             ) : (
                                 <div className="text-center text-muted-foreground group-hover:text-accent transition-colors pointer-events-none">
                                     <UploadCloud className="h-12 w-12 mx-auto mb-3" />
                                     <p className="font-semibold">Image {index + 1}</p>
                                     <p className="text-xs mt-1">(Drop, Click, or Capture)</p>
                                      {isDraggingOver[index] && <p className="text-xs mt-1 text-primary font-bold">Drop here!</p>}
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>

                  {/* ImageSelector for Upload/Camera buttons */}
                 <ImageSelector
                     onImageSelect={handleImageSelect}
                     disabled={imageUrls[0] !== null && imageUrls[1] !== null}
                     showUploadOption={true} // Ensure upload option is shown
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
                             disabled={isLoading}
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
                             disabled={isLoading}
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
               onClose={handleReset} // Reset state when closing
               image1Url={imageUrls[0]}
               image2Url={imageUrls[1]}
               open={showResultsPopup} // Controlled by state
               setOpen={setShowResultsPopup} // Allow closing
           />
       )}
     </main>
  );
}
