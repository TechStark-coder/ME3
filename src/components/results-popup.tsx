
import React, { useState, useEffect } from 'react';
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
import { RefreshCw, CheckCircle, XCircle, Info, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  startCondition?: boolean; // Only start typing when true
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 30, className, onComplete, startCondition = true }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset only if text changes or startCondition becomes false then true again
    if (startCondition) {
        setDisplayText('');
        setCurrentIndex(0);
    }
  }, [text, startCondition]);

  useEffect(() => {
    if (startCondition && currentIndex < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeoutId);
    } else if (startCondition && currentIndex === text.length && text.length > 0) {
        onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, startCondition]);

  // If not started, display nothing or placeholder
  return startCondition ? <span className={className}>{displayText}</span> : <span className={className}>&nbsp;</span>;
};


interface ResultsPopupProps {
  results: string[];
  onClose: () => void;
  image1Url: string;
  image2Url: string; 
  open: boolean;
  setOpen: (open: boolean) => void;
  titleOverride?: string; 
  descriptionOverride?: string;
  isSingleImageAnalysis?: boolean; // Added for context
  currentlyTypingIndex?: number | null; // Index of the item currently being typed
  onTypingComplete?: (index: number) => void; // Callback when an item finishes typing
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
  isSingleImageAnalysis = false, // Default to false (spot the difference)
  currentlyTypingIndex,
  onTypingComplete,
}) => {
  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const noMeaningfulResults = 
    results.length === 0 || 
    results.every(r => 
      r === "AI analysis returned no result." || 
      r === "AI output format error." || 
      r === "AI analysis returned no result for objects." || 
      r === "AI output format error for objects."
    );

  const hasResults = !noMeaningfulResults;

  const defaultTitle = hasResults ? "Analysis Complete" : "Analysis Result";
  const defaultDescription = hasResults
    ? (isSingleImageAnalysis ? "The following objects were identified in the image:" : "Here are the differences found between the images:")
    : (isSingleImageAnalysis ? "No distinct objects were identified or the AI could not process the image." : "Looks like the images are identical or no differences found!");

  const displayTitle = titleOverride || defaultTitle;
  const displayDescription = descriptionOverride || defaultDescription;

  let IconComponent = Info;
  if (titleOverride && isSingleImageAnalysis) { // Specific for single image analysis with override
    IconComponent = hasResults ? CheckCircle : XCircle;
  } else { // Default for spot-the-difference or if no override for single
    IconComponent = hasResults ? CheckCircle : XCircle;
  }

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
  
    doc.setFontSize(18);
    doc.text("AI List Details", 14, 22); 
  
    doc.setFontSize(12);
    let yPosition = 30;
    const margin = 14;
    const MaxWidth = doc.internal.pageSize.getWidth() - 2 * margin;
  
    results.forEach((item, index) => {
      const textLines = doc.splitTextToSize(`${index + 1}. ${item}`, MaxWidth);
      
      // Check if there's enough space for the lines, if not, add a new page
      if (yPosition + (textLines.length * 7) > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin; // Reset Y position for new page
      }

      textLines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - margin) { 
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7; // Line height
      });
      yPosition += 3; // Extra space between items
    });
  
    doc.save("AI-List-Details.pdf");
  };


  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true);}}>
      <AlertDialogContent className="glassmorphic max-w-lg w-[90vw] md:w-full transform transition-all duration-500 ease-out data-[state=open]:scale-100 data-[state=closed]:scale-95 data-[state=open]:opacity-100 data-[state=closed]:opacity-0">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <IconComponent 
              className={cn(
                "h-6 w-6",
                hasResults && isSingleImageAnalysis ? "text-primary" : 
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
            <ScrollArea className="h-60 max-h-[40vh] w-full rounded-md border border-border/50 p-3 bg-background/70">
              <ul className="space-y-2 text-sm text-foreground">
                {results.map((item, index) => (
                  <li key={index} className="font-medium flex items-start gap-2 p-1.5 rounded hover:bg-accent/10 min-h-[1.5em]"> {/* Ensure min height for typewritter */}
                    <span className="mt-1 text-primary">•</span>
                    {isSingleImageAnalysis && onTypingComplete && typeof currentlyTypingIndex === 'number' ? (
                         <Typewriter
                           text={item}
                           className="flex-1"
                           startCondition={index <= currentlyTypingIndex}
                           onComplete={() => onTypingComplete(index)}
                         />
                    ) : (
                       <span>{item}</span>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        )}

        <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
          {hasResults && (
            <Button
              onClick={handleDownloadPdf}
              variant="default"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          <AlertDialogAction asChild>
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full sm:w-auto"
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
