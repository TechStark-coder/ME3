
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw } from 'lucide-react'; // Keep RefreshCw
import { cn } from '@/lib/utils';

interface ResultsPopupProps {
  results: string[]; // Represents the list of differences
  onClose: () => void; // Should trigger the reset logic
  image1Url: string; // Expecting a data URI
  image2Url: string; // Expecting a data URI
}

const ResultsPopup: React.FC<ResultsPopupProps> = ({ results, onClose, image1Url, image2Url }) => {
  return (
    <Card className="w-full max-w-xl mx-auto relative glassmorphic border-none shadow-xl"> {/* Increased max-w */}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">Analysis Complete</CardTitle>
        {/* Updated description */}
        <CardDescription>Here are the differences found between the images:</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
             <Image
               src={image1Url} // Use the data URI directly
               alt="Image 1 (Reference)" // Updated alt text
               layout="fill"
               objectFit="contain"
               className="bg-muted/30"
               data-ai-hint="original comparison"
               // Add onError handler for robustness
               onError={(e) => console.error("Error loading image 1 in results:", e)}
             />
             <p className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded text-center">Image 1 (Reference)</p>
           </div>
           <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
             <Image
               src={image2Url} // Use the data URI directly
               alt="Image 2 (Comparison)" // Updated alt text
               layout="fill"
               objectFit="contain"
               className="bg-muted/30"
               data-ai-hint="modified comparison"
                // Add onError handler for robustness
               onError={(e) => console.error("Error loading image 2 in results:", e)}
             />
              <p className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded text-center">Image 2 (Comparison)</p>
           </div>
        </div>

        {/* Updated heading */}
        <h3 className="text-lg font-semibold mb-3 text-center text-foreground">Differences Found:</h3>

        {/* Board Container */}
        <div className="relative bg-[#deb887] dark:bg-[#8B4513] p-2 rounded-md shadow-md mx-auto max-w-md"> {/* Wooden Frame */}
          <div className="relative bg-[#F5F5DC] dark:bg-[#E6D8B8] p-4 rounded-sm min-h-[150px]"> {/* Paper Background */}
            {/* Decorative Pins */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full shadow-inner"></div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full shadow-inner"></div>
            {/* <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full shadow-inner"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full shadow-inner"></div> */}

            {results.length > 0 ? (
              <ScrollArea className="h-36 w-full"> {/* Adjusted height */}
                <ul className="list-disc list-inside space-y-1 text-left text-black dark:text-gray-800"> {/* Text color for paper */}
                  {results.map((item, index) => (
                    // Use bold font for emphasis
                    <li key={index} className="font-semibold"> {/* Changed to font-semibold for slightly less emphasis */}
                      {item}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              // Updated message for no differences
              <p className="text-gray-600 dark:text-gray-700 text-center p-3">No significant differences identified.</p>
            )}
          </div>
        </div>

         <div className="mt-6 text-center">
          {/* Button remains "Start Over" */}
          <Button onClick={onClose} variant="outline">
             <RefreshCw className="mr-2 h-4 w-4" /> Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsPopup;
