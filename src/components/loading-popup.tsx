
import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react'; // Using Sparkles for the AI animation
import { cn } from '@/lib/utils';

interface LoadingPopupProps {
  imageUrl: string;
  message: string;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({ imageUrl, message }) => {
  return (
    // Centered container for the popup content
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-48 h-48 md:w-64 md:h-64">
        {/* Circular image container */}
        <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-primary shadow-lg animate-pulse">
          <Image
            src={imageUrl}
            alt="Loading image"
            layout="fill"
            objectFit="cover"
            className="rounded-full"
          />
        </div>
        {/* Animated Sparkles */}
        {[...Array(8)].map((_, i) => (
          <Sparkles
            key={i}
            className={cn(
              'absolute text-accent animate-sparkle',
              'w-6 h-6 md:w-8 md:h-8' // Adjust size as needed
            )}
            style={{
              // Position sparkles around the circle
              top: `calc(50% + ${Math.sin((i / 8) * 2 * Math.PI) * 55}%)`, // Adjusted radius factor
              left: `calc(50% + ${Math.cos((i / 8) * 2 * Math.PI) * 55}%)`, // Adjusted radius factor
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.15}s`, // Stagger animation
            }}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <p className="mt-6 text-lg md:text-xl font-semibold text-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default LoadingPopup;
