
"use client";

import React, { useState, useCallback, useRef } from 'react';
import ImageSelector from '@/components/image-selector';
import LoadingPopup from '@/components/loading-popup';
import ResultsPopup from '@/components/results-popup'; // Reusing for consistency, will adapt props
import { Button } from '@/components/ui/button';
import { X, RefreshCw, SearchCheck, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon import
import Image from 'next/image';
import { analyzeImageObjects } from '@/ai/flows/analyze-single-image-flow'; // New flow
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

// Helper function to read file as Data URL (can be moved to a utils file later)
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

// Helper to ensure data URI (can be moved to utils)
async function ensureDataUri(url: string | null, toast: ReturnType<typeof useToast>['toast']): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:')) return url;

    if (url.startsWith('blob:')) {
        console.log('Converting blob URL to data URI for analysis:', url.substring(0,50));
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
            const blob = await response.blob();
            const dataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') resolve(reader.result);
                    else reject(new Error("FileReader did not return a string."));
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            URL.revokeObjectURL(url); // Clean up blob URL
            return dataUri;
        } catch (error) {
            console.error("Error converting blob URL to data URI:", error);
            toast({
                title: "Image Processing Error",
                description: `Could not process captured image. ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
            return null;
        }
    }
    toast({ title: "Invalid Image", description: "Please provide a valid image.", variant: "destructive" });
    return null;
}


export default function AnalyzeSingleImagePage() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<string[] | null>(null);
  const [showResultsPopup, setShowResultsPopup] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const handleImageSelect = useCallback((dataUrl: string | null, fileName: string = "Image provided") => {
    if (!dataUrl) {
      toast({
        title: 'Image Error',
        description: 'Could not process the selected image.',
        variant: 'destructive',
      });
      return;
    }
    setImageUrl(dataUrl);
    setImageFileName(fileName);
    setErrorMessage(null);
    setAnalysisResults(null);
    setShowResultsPopup(false);
    console.log("Single image selected:", { name: fileName });
  }, [toast]);

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageFileName(null);
    setAnalysisResults(null);
    setShowResultsPopup(false);
    setErrorMessage(null);
    setIsLoading(false);
    console.log(`Image removed.`);
  };

  const handleAnalyzeImage = async () => {
    if (!imageUrl) {
      setErrorMessage("Please select an image before analyzing.");
      toast({
        title: "Missing Image",
        description: "Please select an image to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisResults(null);
    setShowResultsPopup(false);
    console.log('Starting single image analysis...');

    try {
      const dataUri = await ensureDataUri(imageUrl, toast);
      if (!dataUri) {
        setErrorMessage("The image could not be processed. Please try re-uploading or recapturing.");
        setIsLoading(false);
        return;
      }

      console.log('Calling AI flow (analyzeImageObjects)...');
      const result = await analyzeImageObjects({ imageDataUri: dataUri });
      console.log('AI analysis completed, result:', result);

      if (!result || !Array.isArray(result.objects)) {
        console.error('Invalid result structure from AI:', result);
        setErrorMessage('Received an invalid response from the AI analysis.');
        toast({
          title: "Analysis Error",
          description: "Received unexpected data from the analysis.",
          variant: "destructive",
        });
      } else {
        setAnalysisResults(result.objects);
        setShowResultsPopup(true);
      }

    } catch (error: any) {
      console.error("Error during single image analysis in page.tsx:", error);
      let errorDesc = 'An unexpected error occurred during analysis.';
       if (error instanceof Error) {
           errorDesc = error.message.includes('AI analysis failed') ? error.message : `Details: ${error.message}`;
        } else {
            errorDesc = `An unexpected error occurred: ${String(error)}`;
        }
      setErrorMessage(`Analysis Failed: ${errorDesc}`);
      toast({
        title: "Analysis Failed",
        description: errorDesc,
        variant: "destructive",
        duration: 9000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setImageFileName(null);
    setIsLoading(false);
    setAnalysisResults(null);
    setShowResultsPopup(false);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    console.log("Single image analysis page reset.");
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (imageUrl !== null) {
      toast({ title: "Slot Full", description: `Remove the current image first.`, variant: "destructive" });
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        handleImageSelect(dataUrl, file.name);
      } catch (error) {
        console.error("Error reading dropped file:", error);
        toast({ title: "Read Error", description: "Could not read the dropped file.", variant: "destructive" });
      }
    } else if (file) {
      toast({ title: "Invalid File Type", description: "Please drop an image file.", variant: "destructive" });
    }
  };
  
  const handleBoxClick = () => {
    if (imageUrl === null && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const showAnalyzeButton = imageUrl !== null && !isLoading && !showResultsPopup;
  const showResetButton = (imageUrl !== null || showResultsPopup) && !isLoading;

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4 md:p-8 relative z-10 overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith('image/')) {
            try {
              const dataUrl = await readFileAsDataURL(file);
              handleImageSelect(dataUrl, file.name);
            } catch (err) { toast({ title: "Error", description: "Failed to read file.", variant: "destructive" }); }
          }
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        accept="image/*"
        className="hidden"
        id="single-image-upload-input"
      />
      <div className="glassmorphic p-6 md:p-10 w-full max-w-md text-center relative animate-fade-slide-in">
        {isLoading && !showResultsPopup && imageUrl ? (
          <LoadingPopup
            imageUrl={imageUrl}
            message={"Magic is happening..."}
          />
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Analyze Single Image 🖼️
            </h1>
            <p className="text-muted-foreground mb-8 text-base md:text-lg">
              Upload or capture an image. AI will identify objects within it.
            </p>

            <div
              className={cn(
                "border-2 border-dashed border-border/50 rounded-lg p-4 flex flex-col items-center justify-center aspect-square relative bg-background/40 transition-colors duration-300 group mb-8",
                imageUrl === null ? 'cursor-pointer hover:border-accent hover:bg-accent/10' : '',
                isDraggingOver ? 'border-primary bg-primary/10 scale-105 shadow-lg' : ''
              )}
              onClick={handleBoxClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              aria-label={imageUrl ? `Image: ${imageFileName || ''}` : `Drop or click to upload Image`}
              role="button"
              tabIndex={imageUrl === null ? 0 : -1}
            >
              {imageUrl ? (
                <>
                  <Image
                    src={imageUrl}
                    alt={`Selected image: ${imageFileName}`}
                    width={200}
                    height={200}
                    className="object-contain rounded-md mb-3 shadow-md max-h-[70%]"
                    data-ai-hint="uploaded item"
                    onError={() => {
                        toast({ title: "Image Load Error", description: `Could not display the image.`, variant: "destructive" });
                        handleRemoveImage();
                    }}
                  />
                  <p className="text-sm text-foreground truncate w-full px-2 font-medium" title={imageFileName || ''}>
                    {imageFileName || `Uploaded Image`}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 bg-destructive/80 text-destructive-foreground hover:bg-destructive rounded-full transition-all z-10"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                    aria-label={`Remove image`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground group-hover:text-accent transition-colors pointer-events-none">
                  <ImageIcon className="h-16 w-16 mx-auto mb-3" />
                  <p className="font-semibold">Drop or Click to Upload</p>
                  <p className="text-xs mt-1">(Or use camera below)</p>
                  {isDraggingOver && <p className="text-xs mt-1 text-primary font-bold">Drop here!</p>}
                </div>
              )}
            </div>
            
            <ImageSelector
              onImageSelect={handleImageSelect}
              disabled={imageUrl !== null}
              showUploadOption={imageUrl === null} // Show upload via button only if no image in box
            />

            {errorMessage && (
              <p className="mt-4 text-sm text-destructive dark:text-red-400 font-medium">
                {errorMessage}
              </p>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
              {showAnalyzeButton && (
                <Button
                  onClick={handleAnalyzeImage}
                  className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105"
                  disabled={isLoading}
                >
                  <SearchCheck className="mr-2 h-4 w-4" /> Analyze Image
                </Button>
              )}
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

      {analysisResults !== null && imageUrl && (
        <ResultsPopup // This needs to be adapted or a new one created for single image object list
          results={analysisResults.length > 0 ? analysisResults : ["No distinct objects identified or AI could not process."]}
          onClose={handleReset}
          image1Url={imageUrl} // Pass the single image as image1 for display
          image2Url={imageUrl} // Pass same image again, or adapt ResultsPopup
          open={showResultsPopup}
          setOpen={setShowResultsPopup}
          // Custom title for this context
          titleOverride={analysisResults.length > 0 ? "Objects Identified" : "Analysis Result"}
          descriptionOverride={analysisResults.length > 0 ? "The following objects were identified in the image:" : "No objects were clearly identified, or the image content was unclear."}
        />
      )}
    </main>
  );
}

    