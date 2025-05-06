// src/components/custom-logo.tsx
import React from 'react';

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {}

const CustomLogo: React.FC<CustomLogoProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100" // Adjusted viewBox for better scaling
      width="24" // Default width, can be overridden by props
      height="24" // Default height, can be overridden by props
      {...props}
    >
      {/* Background shapes (clouds/abstract) */}
      <path d="M20 50 Q25 35 40 40 T60 50 Q55 65 40 60 T20 50Z" fill="#43C6AC" opacity="0.7" />
      <path d="M70 45 Q75 30 90 35 T100 45 Q95 60 80 55 T70 45Z" fill="#43C6AC" opacity="0.5" />

      {/* Magnifying Glass Handle */}
      <rect x="68" y="68" width="8" height="25" rx="3" ry="3" transform="rotate(45 72 80.5)" fill="#FF8C42" />

      {/* Magnifying Glass Ring */}
      <circle cx="50" cy="50" r="28" fill="none" stroke="#FF8C42" strokeWidth="6" />
      <circle cx="50" cy="50" r="23" fill="hsl(var(--background))" /> {/* Inner part of magnifying glass to see through */}
      
      {/* Camera Body */}
      <rect x="35" y="40" width="30" height="20" rx="3" ry="3" fill="#FCE0B5" />
      
      {/* Camera Lens */}
      <circle cx="50" cy="50" r="10" fill="#2c3e50" />
      <circle cx="50" cy="50" r="6" fill="#43C6AC" />
      <circle cx="50" cy="50" r="3" fill="#191654" />
      
      {/* Camera Flash/Button */}
      <rect x="58" y="36" width="5" height="3" rx="1" fill="#FF8C42" />
      <circle cx="39" cy="38" r="2" fill="#FF8C42" />

      {/* Sparkles/details (optional) */}
      <path d="M25 30 L27 28 L30 30 L27 32Z" fill="#FFD700" />
      <path d="M80 25 L82 23 L85 25 L82 27Z" fill="#FFD700" />
    </svg>
  );
};

export default CustomLogo;
