// src/components/custom-logo.tsx
import React from 'react';

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {}

const CustomLogo: React.FC<CustomLogoProps> = (props) => {
  // Define colors from the provided image
  const tealColor = "#00FFFF"; // Cyan/Teal for lines and accents
  const whiteColor = "#FFFFFF"; // White for text and highlights
  const darkGrayHandle = "#4A4A4A"; // A dark gray for the magnifying glass handle, assuming it's not pure black

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200" // Adjusted viewBox to fit the design
      // width="100" // Example width, will be controlled by className in AppHeader
      // height="100" // Example height
      {...props}
    >
      {/* Background rectangle - if the logo itself needs a black background independent of the page */}
      {/* <rect width="200" height="200" fill="#000000" /> */}

      {/* Stylized circuit lines on the left */}
      <line x1="30" y1="20" x2="30" y2="180" stroke={tealColor} strokeWidth="4" />
      <circle cx="30" cy="20" r="6" fill={tealColor} />
      <rect x="26" y="60" width="8" height="8" fill={tealColor} />
      <rect x="26" y="100" width="8" height="8" fill={tealColor} />
      <rect x="26" y="140" width="8" height="8" fill={tealColor} />

      {/* Horizontal circuit lines below magnifying glass */}
      <line x1="30" y1="150" x2="100" y2="150" stroke={tealColor} strokeWidth="3" />
      <line x1="40" y1="155" x2="90" y2="155" stroke={tealColor} strokeWidth="2" />
      <line x1="40" y1="145" x2="90" y2="145" stroke={tealColor} strokeWidth="2" />
      <circle cx="100" cy="150" r="4" fill={tealColor} />


      {/* Magnifying glass */}
      <g transform="translate(10, 25)">
        <circle cx="100" cy="75" r="45" stroke={whiteColor} strokeWidth="5" fill="rgba(255,255,255,0.1)" />
        {/* Lens details (subtle inner lines/reflections if desired) - simplified */}
        <circle cx="100" cy="75" r="35" stroke={whiteColor} strokeWidth="1" opacity="0.3" />
        <path d="M135 110 L165 140" stroke={darkGrayHandle} strokeWidth="10" strokeLinecap="round" />
         {/* Inner "camera shutter" like lines - very simplified */}
        <path d="M100,40 Q80,75 100,110" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
        <path d="M70,55 Q100,65 130,55" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
         <path d="M70,95 Q100,85 130,95" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
      </g>
      
      {/* Text "AI IMAGE" */}
      <text
        x="115" // Centered based on approximate visual center of text block
        y="150" // Positioned below the circuit lines
        fontFamily="Arial, Helvetica, sans-serif" // A common sans-serif font
        fontSize="20" // Adjust size as needed
        fontWeight="bold"
        fill={whiteColor}
        textAnchor="middle"
      >
        AI IMAGE
      </text>

      {/* Text "Compare" - script-like font is hard to replicate perfectly in SVG without font embedding */}
      {/* Using a common cursive or a more stylized sans-serif as a fallback */}
      <text
        x="115" // Centered
        y="175" // Below "AI IMAGE"
        fontFamily="'Brush Script MT', 'Comic Sans MS', cursive, sans-serif" // Font stack for cursive effect
        fontSize="24" // Adjust size
        fontWeight="bold" // Script fonts often look better bold or normal, adjust as needed
        fill={whiteColor}
        textAnchor="middle"
      >
        Compare
      </text>
    </svg>
  );
};

export default CustomLogo;
