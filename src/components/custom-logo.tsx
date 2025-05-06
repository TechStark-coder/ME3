// src/components/custom-logo.tsx
import React from 'react';

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {}

const CustomLogo: React.FC<CustomLogoProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 150" // Adjusted viewBox for the new logo's aspect ratio
      {...props}
    >
      <g fill="currentColor">
        {/* Eye Symbol - Outer Shape */}
        <path d="M100,20C30,20,10,60,10,60s-5,45,90,45s90-45,90-45S170,20,100,20z M100,95c-35,0-55-22-55-22s15-23,55-23s55,23,55,23S135,95,100,95z"/>
        {/* Eye Symbol - Iris */}
        <circle cx="100" cy="65" r="20"/>
        {/* Eye Symbol - Pupil */}
        <circle cx="100" cy="65" r="10" fill="hsl(var(--background))"/> {/* Use background for pupil to make it 'see-through' or contrast */}
         {/* Optional: small highlight on pupil */}
        <circle cx="108" cy="58" r="4" fill="hsl(var(--foreground))" opacity="0.7"/>

        {/* Swoosh under eye */}
        <path d="M70,92 Q100,102 130,92 Q100,100 70,92 Z" />

        {/* Text: "Ai Image" */}
        {/* Increased font size and adjusted y positions for better visibility */}
        <text x="100" y="122" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle">
          Ai Image
        </text>
        {/* Text: "Compare" */}
        <text x="100" y="140" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle">
          Compare
        </text>
      </g>
    </svg>
  );
};

export default CustomLogo;
