
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
import { RefreshCw } from 'lucide-react';
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

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="glassmorphic max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl font-bold text-foreground">
            Analysis Complete
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Here are the differences found between the images:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Image Comparison Section */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <Image
              src={image1Url}
              alt="Image 1 (Reference)"
              layout="fill"
              objectFit="contain"
              className="bg-muted/30"
              data-ai-hint="original comparison"
              onError={(e) => console.error("Error loading image 1 in results:", e)}
            />
            <p className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded text-center">Image 1</p>
          </div>
          <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <Image
              src={image2Url}
              alt="Image 2 (Comparison)"
              layout="fill"
              objectFit="contain"
              className="bg-muted/30"
              data-ai-hint="modified comparison"
              onError={(e) => console.error("Error loading image 2 in results:", e)}
            />
            <p className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded text-center">Image 2</p>
          </div>
        </div>

        {/* Differences List Section */}
        <h3 className="text-lg font-semibold mb-2 text-center text-foreground">Differences Found:</h3>
        <ScrollArea className="h-40 w-full rounded-md border p-4 bg-background/80">
          {results.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
              {results.map((item, index) => (
                <li key={index} className="font-medium"> {/* Use font-medium or normal */}
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center italic p-3">
              No significant differences identified.
            </p>
          )}
        </ScrollArea>

        <AlertDialogFooter className="mt-4">
           {/* Use AlertDialogAction which closes the dialog by default, override onClick */}
           <AlertDialogAction asChild>
             <Button onClick={handleClose} variant="outline">
               <RefreshCw className="mr-2 h-4 w-4" /> Start Over
             </Button>
           </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResultsPopup;
