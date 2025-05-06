
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle, XCircle, Info } from 'lucide-react'; // Added Info icon
import { cn } from '@/lib/utils';

interface ResultsPopupProps {
  results: string[];
  onClose: () => void;
  image1Url: string;
  image2Url: string; // Keep for Spot the Difference, can be same as image1Url for single analysis
  open: boolean;
  setOpen: (open: boolean) => void;
  titleOverride?: string; // Optional title for different contexts
  descriptionOverride?: string; // Optional description
}

const ResultsPopup: React.FC<ResultsPopupProps> = ({
  results,
  onClose,
  image1Url,
  image2Url,
  open,
  setOpen,
  titleOverride,
  descriptionOverride,
}) => {
  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const hasResults = results.length > 0 && results[0] !== "AI analysis returned no result." && results[0] !== "AI output format error." && results[0] !== "AI analysis returned no result for objects." && results[0] !== "AI output format error for objects.";
  const isSingleImageAnalysis = image1Url === image2Url; // Heuristic to detect single image mode

  const defaultTitle = hasResults ? "Analysis Complete" : "Analysis Result";
  const defaultDescription = hasResults
    ? (isSingleImageAnalysis ? "The following objects were identified in the image:" : "Here are the differences found between the images:")
    : (isSingleImageAnalysis ? "No distinct objects were identified or the AI could not process the image." : "Looks like the images are identical or no differences found!");

  const displayTitle = titleOverride || defaultTitle;
  const displayDescription = descriptionOverride || defaultDescription;

  let IconComponent = Info; // Default icon
  if (titleOverride) { // If custom title, use Info or a specific icon based on context
    IconComponent = hasResults ? CheckCircle : XCircle;
  } else { // For default spot-the-difference
    IconComponent = hasResults ? CheckCircle : XCircle;
  }


  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true);}}>
      <AlertDialogContent className="glassmorphic max-w-lg w-[90vw] md:w-full">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <IconComponent 
              className={cn(
                "h-6 w-6",
                hasResults && titleOverride ? "text-primary" : // Specific color for identified objects
                hasResults ? "text-green-500" : 
                "text-orange-500" 
              )} 
            />
            {displayTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            {displayDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className={cn("grid gap-4 my-6", isSingleImageAnalysis ? "grid-cols-1 justify-items-center" : "grid-cols-2")}>
          <div className="flex flex-col items-center gap-2">
            {image1Url && (
              <>
              <p className="text-sm font-medium text-muted-foreground">
                {isSingleImageAnalysis ? "Analyzed Image" : "Image 1 (Reference)"}
              </p>
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border w-full max-w-[200px] sm:max-w-[250px]">
                <Image
                  src={image1Url}
                  alt={isSingleImageAnalysis ? "Analyzed Image" : "Image 1 (Reference)"}
                  layout="fill"
                  objectFit="contain"
                  className="bg-muted/20"
                  data-ai-hint={isSingleImageAnalysis ? "analyzed subject" : "original comparison"}
                  onError={(e) => console.error("Error loading image 1 in results:", e)}
                />
              </div>
              </>
            )}
          </div>
          {!isSingleImageAnalysis && image2Url && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Image 2 (Compared)</p>
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border w-full max-w-[200px] sm:max-w-[250px]">
                <Image
                  src={image2Url}
                  alt="Image 2 (Comparison)"
                  layout="fill"
                  objectFit="contain"
                  className="bg-muted/20"
                  data-ai-hint="modified comparison"
                  onError={(e) => console.error("Error loading image 2 in results:", e)}
                />
              </div>
            </div>
          )}
        </div>

        {hasResults && (
          <>
            <h3 className="text-lg font-semibold mb-2 text-center text-foreground">
              {isSingleImageAnalysis ? "Identified Items:" : "Details:"}
            </h3>
            <ScrollArea className="h-40 max-h-[30vh] w-full rounded-md border border-border/50 p-3 bg-background/70">
              <ul className="space-y-1.5 text-sm text-foreground">
                {results.map((item, index) => (
                  <li key={index} className="font-medium flex items-start gap-2 p-1 rounded hover:bg-accent/10">
                    <span className="mt-1 text-primary">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        )}

        <AlertDialogFooter className="mt-6 sm:justify-center">
          <AlertDialogAction asChild>
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full sm:w-auto border-foreground/30 hover:bg-accent/10 hover:border-accent transition-all"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> {isSingleImageAnalysis ? "Analyze Another" : "Start Over"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResultsPopup;
