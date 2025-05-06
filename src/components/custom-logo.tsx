/ src/components/custom-logo.tsx
import React from 'react';

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {}

const CustomLogo: React.FC<CustomLogoProps> = (props) => {
  const mgOrange = "#F57C00"; // Magnifying glass orange
  const cameraBody = "#FFE0B2"; // Light peach/beige for camera body
  const lensOuterTeal = "#0097A7"; // Darker teal for lens outer ring
  const lensInnerGreen = "#4CAF50"; // Green for lens inner part
  const cloudBlue = "#B2EBF2"; // Light cyan/blue for cloud shapes
  const textNavy = "#1A237E"; // Dark navy blue for "Ai Image Compare" text
  const highlightWhite = "#FFFFFF"; // For highlights and text outline
  const cameraTopOrange = "#FB8C00"; // Slightly lighter orange for camera top detail/button

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 185" // Adjusted viewBox for new design, height increased slightly for text
      {...props}
    >
      <g id="logo-background-elements">
        {/* Simplified Cloud Shapes */}
        <path d="M25,95 Q35,65 60,75 T95,90 Q85,115 60,105 T25,95 Z" fill={cloudBlue} opacity="0.7" />
        <path d="M125,90 Q135,60 160,70 T195,85 Q185,110 160,100 T125,90 Z" fill={cloudBlue} opacity="0.7" />
        
        {/* Sparkle top-left area (simplified star) */}
        <polygon points="45,50 48,60 58,63 48,66 45,76 42,66 32,63 42,60" fill={highlightWhite} />
      </g>
      
      <g id="magnifying-glass-and-camera">
        {/* Magnifying Glass Ring */}
        {/* Fill with a very light transparent color to simulate the lens glass if needed, or keep transparent */}
        <circle cx="110" cy="80" r="50" stroke={mgOrange} strokeWidth="12" fill="rgba(255,255,255,0.1)" /> 
        
        {/* Camera Body */}
        <rect x="80" y="55" width="60" height="40" rx="5" ry="5" fill={cameraBody} />
        {/* Camera Lens Assembly */}
        <circle cx="110" cy="75" r="15" fill={lensOuterTeal} /> {/* Outer ring of lens */}
        <circle cx="110" cy="75" r="9" fill={lensInnerGreen} /> {/* Inner part of lens */}
        <circle cx="104" cy="72" r="3" fill={highlightWhite} opacity="0.8" /> {/* Lens highlight */}
        {/* Camera Top detail / Button */}
        <rect x="95" y="48" width="30" height="7" rx="2" ry="2" fill={cameraTopOrange} />
         {/* Tiny dots on camera sides (simplified) */}
        <circle cx="75" cy="90" r="1.5" fill={lensOuterTeal} />
        <circle cx="145" cy="90" r="1.5" fill={lensOuterTeal} />

        {/* Magnifying Glass Handle */}
        <path d="M145,115 L175,145 A5,5 0 0,1 170,152 L140,122 A5,5 0 0,1 145,115 Z" fill={mgOrange} />
      </g>

      <g id="logo-text">
        {/* AI IMAGE text */}
        <text 
          x="110" 
          y="155"  // Positioned below the magnifying glass
          fontFamily="Arial, 'Helvetica Neue', Helvetica, sans-serif" 
          fontSize="28" 
          fontWeight="bold" 
          textAnchor="middle" 
          fill={"#1A237E"}
          stroke={"#FFFFFF"} // White outline
          strokeWidth="0.5" // Thin outline
        >
          Ai Image
        </text>
        {/* COMPARE text */}
        <text 
          x="110" 
          y="180" // Second line of text
          fontFamily="Arial, 'Helvetica Neue', Helvetica, sans-serif" 
          fontSize="28" 
          fontWeight="bold" 
          textAnchor="middle" 
          fill={"#1A237E"}
          stroke={"#FFFFFF"} // White outline
          strokeWidth="0.5" // Thin outline
        >
          Compare
        </text>
      </g>
    </svg>
  );
};

export default CustomLogo;
