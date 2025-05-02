
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, RefreshCw } from 'lucide-react'; // Import RefreshCw

interface ResultsPopupProps {
  results: string[];
  onClose: () => void; // Should trigger the reset logic
  image1Url: string;
  image2Url: string;
}

const ResultsPopup: React.FC<ResultsPopupProps> = ({ results, onClose, image1Url, image2Url }) => {
  return (
    <Card className="w-full max-w-lg mx-auto relative glassmorphic border-none shadow-xl">
       {/* Keep X button for immediate dismissal (optional, can be removed if Start Over is enough) */}
       {/* <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-7 w-7 z-10 bg-background/50 hover:bg-background/80"
        onClick={onClose} // Or a different function if X should just hide temporarily
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close Results</span>
      </Button> */}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">Analysis Complete</CardTitle>
        <CardDescription>Here's what changed between the images:</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
             <Image
               src={image1Url}
               alt="Image 1"
               layout="fill"
               objectFit="contain"
               className="bg-muted/30"
               data-ai-hint="original comparison"
             />
             <p className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded text-center">Image 1 (Original)</p>
           </div>
           <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
             <Image
               src={image2Url}
               alt="Image 2"
               layout="fill"
               objectFit="contain"
               className="bg-muted/30"
               data-ai-hint="modified comparison"
             />
              <p className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded text-center">Image 2 (Modified)</p>
           </div>
        </div>

        <h3 className="text-lg font-semibold mb-3 text-left text-foreground">Missing Objects in Image 2:</h3>
        {results.length > 0 ? (
          <ScrollArea className="h-32 w-full rounded-md border border-border p-3 bg-background/50">
            <ul className="list-disc list-inside space-y-1 text-left">
              {results.map((item, index) => (
                <li key={index} className="font-medium text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-left p-3 border border-border rounded-md bg-background/50">No missing objects identified.</p>
        )}
         <div className="mt-6 text-center">
          {/* Changed button text and icon */}
          <Button onClick={onClose} variant="outline">
             <RefreshCw className="mr-2 h-4 w-4" /> Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsPopup;

