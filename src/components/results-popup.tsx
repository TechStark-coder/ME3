
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
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'; // Added icons
import { cn } from '@/lib/utils';

interface ResultsPopupProps {
  results: string[]; // Represents the list of differences
  onClose: () => void; // Should trigger the reset logic
  image1Url: string; // Expecting a data URI
  image2Url: string; // Expecting a data URI
  open: boolean; // Control the visibility from parent
  setOpen: (open: boolean) => void; // Allow parent to control visibility
}

const ResultsPopup: React.FC<ResultsPopupProps> = ({ results, onClose, image1Url, image2Url, open, setOpen }) => {
  // Handle closing the dialog and triggering the parent's onClose logic
  const handleClose = () => {
    setOpen(false);
    onClose(); // Call the original reset logic
  };

  const hasDifferences = results.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
       {/* Apply glassmorphic effect and adjust max-width */}
      <AlertDialogContent className="glassmorphic max-w-lg w-[90vw] md:w-full">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl font-bold text-foreground flex items-center justify-center gap-2">
             {/* Add icon based on results */}
            {hasDifferences ? <CheckCircle className="text-green-500 h-6 w-6" /> : <XCircle className="text-orange-500 h-6 w-6" />}
            Analysis Complete
          </AlertDialogTitle>
           <AlertDialogDescription className="text-center text-muted-foreground">
            {hasDifferences
              ? "Here are the differences found between the images:"
              : "Looks like the images are identical!"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Image Comparison Section - Increased gap and added labels */}
        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="flex flex-col items-center gap-2">
             <p className="text-sm font-medium text-muted-foreground">Image 1 (Reference)</p>
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border w-full">
              <Image
                src={image1Url}
                alt="Image 1 (Reference)"
                layout="fill"
                objectFit="contain"
                className="bg-muted/20" // Lighter background
                data-ai-hint="original comparison"
                onError={(e) => console.error("Error loading image 1 in results:", e)}
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
             <p className="text-sm font-medium text-muted-foreground">Image 2 (Compared)</p>
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border w-full">
              <Image
                src={image2Url}
                alt="Image 2 (Comparison)"
                layout="fill"
                objectFit="contain"
                className="bg-muted/20" // Lighter background
                data-ai-hint="modified comparison"
                onError={(e) => console.error("Error loading image 2 in results:", e)}
              />
            </div>
          </div>
        </div>

        {/* Differences List Section - Only show if there are differences */}
        {hasDifferences && (
          <>
            <h3 className="text-lg font-semibold mb-2 text-center text-foreground">Differences Found:</h3>
             {/* Increased height, more padding */}
            <ScrollArea className="h-48 w-full rounded-md border border-border/50 p-4 bg-background/70">
              <ul className="space-y-2 text-sm text-foreground">
                {results.map((item, index) => (
                   // Added bullet point styling
                  <li key={index} className="font-medium flex items-start gap-2">
                     <span className="mt-1 text-accent">•</span> {/* Custom bullet */}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        )}

        {/* Footer with improved button styling */}
        <AlertDialogFooter className="mt-6 sm:justify-center">
           {/* Use AlertDialogAction which closes the dialog by default, override onClick */}
           <AlertDialogAction asChild>
             <Button
               onClick={handleClose}
               variant="outline"
               className="w-full sm:w-auto border-foreground/30 hover:bg-accent/10 hover:border-accent transition-all" // Enhanced outline style
             >
               <RefreshCw className="mr-2 h-4 w-4" /> Start Over
             </Button>
           </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResultsPopup;
