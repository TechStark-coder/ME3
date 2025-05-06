// src/components/custom-logo.tsx
import React from 'react';

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {}

const CustomLogo: React.FC<CustomLogoProps> = (props) => {
  // Colors inspired by the provided logo image
  const accentRedColor = "#D32F2F"; // A strong red for text and accents
  const accentPurpleColor = "#7B1FA2"; // A deep purple for gradients/lens
  const accentPinkColor = "#E91E63"; // A vibrant pink for gradients/lens
  const whiteColor = "#FFFFFF"; // White for outlines and highlights
  const darkHandleColor = "#A00000"; // Darker red for handle

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200" // Adjusted viewBox to fit the new design
      {...props}
    >
      <defs>
        <linearGradient id="lensGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: accentPurpleColor, stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: accentPinkColor, stopOpacity: 0.8 }} />
        </linearGradient>
      </defs>

      {/* Background (optional, if logo needs its own background) */}
      {/* <rect width="200" height="200" fill="black" /> */}

      {/* Vertical Circuit-like lines on the left */}
      <line x1="25" y1="15" x2="25" y2="125" stroke={accentRedColor} strokeWidth="3" />
      <circle cx="25" cy="15" r="5" fill={accentRedColor} />
      <rect x="22" y="50" width="6" height="6" fill={accentRedColor} />
      <rect x="22" y="80" width="6" height="6" fill={accentRedColor} />
      
      {/* Horizontal Circuit-like lines connecting to magnifying glass base */}
      <line x1="25" y1="115" x2="70" y2="115" stroke={accentRedColor} strokeWidth="2.5" />
      <line x1="35" y1="120" x2="65" y2="120" stroke={accentRedColor} strokeWidth="1.5" />
      <line x1="35" y1="110" x2="65" y2="110" stroke={accentRedColor} strokeWidth="1.5" />
      <circle cx="70" cy="115" r="3" fill={accentRedColor} />


      {/* Magnifying Glass */}
      <g transform="translate(30, 10) scale(0.9)">
        {/* Lens with gradient */}
        <circle cx="100" cy="75" r="50" fill="url(#lensGradient)" stroke={whiteColor} strokeWidth="4" />
        
        {/* Camera Icon inside Lens (simplified) */}
        {/* Main body of camera */}
        <path d="M85,65 Q100,55 115,65 L120,85 Q100,95 80,85 Z" fill={whiteColor} opacity="0.7" />
        {/* Lens of camera */}
        <circle cx="100" cy="75" r="12" fill={accentPurpleColor} stroke={whiteColor} strokeWidth="1.5" opacity="0.9"/>
        <circle cx="100" cy="75" r="5" fill={whiteColor} opacity="0.8"/>
        {/* Shutter lines (stylized) */}
        <line x1="100" y1="63" x2="100" y2="58" stroke={whiteColor} strokeWidth="1" opacity="0.5"/>
        <line x1="100" y1="87" x2="100" y2="92" stroke={whiteColor} strokeWidth="1" opacity="0.5"/>
        <line x1="88" y1="75" x2="83" y2="75" stroke={whiteColor} strokeWidth="1" opacity="0.5"/>
        <line x1="112" y1="75" x2="117" y2="75" stroke={whiteColor} strokeWidth="1" opacity="0.5"/>

        {/* Handle */}
        <path d="M140 115 L170 145" stroke={darkHandleColor} strokeWidth="12" strokeLinecap="round" />
      </g>
      
      {/* Text "AI IMAGE" */}
      <text
        x="100" // Centered
        y="155" // Positioned below
        fontFamily="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill={accentRedColor}
        textAnchor="middle"
        letterSpacing="-1"
      >
        AI IMAGE
      </text>

      {/* Text "Compare" - stylized */}
      <text
        x="100" // Centered
        y="185" // Below "AI IMAGE"
        fontFamily="'Brush Script MT', 'Comic Sans MS', cursive, sans-serif"
        fontSize="32"
        fontWeight="bold"
        fill={accentRedColor}
        textAnchor="middle"
      >
        Compare
      </text>
    </svg>
  );
};

export default CustomLogo;
