
import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react'; // Using Sparkles for the AI animation
import { cn } from '@/lib/utils';

interface LoadingPopupProps {
  imageUrl: string; // Expect a single valid URL
  message: string;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({ imageUrl, message }) => {
  // Fallback image URL if the provided one is invalid or null
  const displayImageUrl = imageUrl || '/placeholder-image.png'; // Ensure this placeholder exists or use a default

  return (
    // Centered container for the popup content
    <div className="flex flex-col items-center justify-center p-6 min-h-[350px]"> {/* Slightly increased min-height */}
      <div className="relative w-52 h-52 md:w-64 md:h-64"> {/* Slightly larger image container */}
        {/* Circular image container */}
         {/* Use accent color for border, adjusted pulse */}
        <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-accent/80 shadow-xl animate-pulse bg-muted/50">
          <Image
            src={displayImageUrl} // Use the display URL
            alt="Analyzing image..." // Updated alt text
            layout="fill"
            objectFit="cover"
            className="rounded-full"
             data-ai-hint="abstract process" // AI Hint for placeholder
            onError={(e) => {
              // Handle potential image loading errors, e.g., show a default placeholder
              console.error("Error loading image in popup:", e);
              // Optionally set a different placeholder source if the primary fails
              // e.currentTarget.src = '/fallback-placeholder.png';
            }}
          />
        </div>
        {/* Animated Sparkles */}
        {[...Array(8)].map((_, i) => (
          <Sparkles
            key={i}
             // Use foreground color for sparkles to contrast with red/black bg
            className={cn(
              'absolute text-foreground/80 animate-sparkle', // Changed color to foreground
              'w-5 h-5 md:w-7 md:h-7' // Adjusted size slightly
            )}
            style={{
              // Position sparkles around the circle
              top: `calc(50% + ${Math.sin((i / 8) * 2 * Math.PI) * 60}%)`, // Increased radius factor
              left: `calc(50% + ${Math.cos((i / 8) * 2 * Math.PI) * 60}%)`, // Increased radius factor
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.2}s`, // Stagger animation more
            }}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <p className="mt-8 text-lg md:text-xl font-semibold text-foreground animate-pulse tracking-wide"> {/* Added tracking */}
        {message}
      </p>
    </div>
  );
};

export default LoadingPopup;
