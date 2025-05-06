// src/components/custom-logo.tsx
import React from 'react';

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {}

const CustomLogo: React.FC<CustomLogoProps> = (props) => {
  // Colors from the provided image (approximations)
  const robotBlue = "#2C3E8F"; // Darker blue for robot body
  const accentYellow = "#FDD835"; // Vibrant yellow for screen and text
  const highlightWhite = "#FFFFFF";
  const screenDetailBlue = "#5C6BC0"; // Lighter blue for screen details

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 180" // Adjusted viewBox to better fit the new logo's aspect ratio
      {...props}
    >
      <g id="logo-background-fill" className="hidden">
        {/* This is a trick: if currentColor is black (default from user image bg), make it transparent */}
        {/* Or, if you want a specific background, define it here. For now, transparent. */}
        <rect width="100%" height="100%" fill="transparent" />
      </g>
      
      {/* Robot Figure */}
      <g id="robot">
        {/* Head */}
        <path d="M70,45 A25,25 0 1,1 70,95 A25,25 0 0,1 70,45 Z" fill={robotBlue} />
        <circle cx="70" cy="70" r="18" fill={highlightWhite} /> {/* Visor outline */}
        <circle cx="70" cy="70" r="15" fill={robotBlue} /> {/* Inner visor */}
        <path d="M60,60 Q70,50 80,60" stroke={highlightWhite} strokeWidth="2" fill="none" /> {/* Visor detail */}
         {/* NM letters (simplified) */}
        <text x="58" y="100" fill={accentYellow} fontSize="10" fontWeight="bold">N</text>
        <text x="72" y="100" fill={accentYellow} fontSize="10" fontWeight="bold">M</text>


        {/* Body */}
        <path d="M45,90 C40,100 40,130 55,140 L85,140 C100,130 100,100 95,90 Z" fill={robotBlue} />
        <circle cx="70" cy="115" r="7" fill={highlightWhite} /> {/* Chest light */}

        {/* Arm holding tablet (simplified) */}
        <path d="M90,95 Q100,85 110,90 L115,115 Q105,125 95,120 Z" fill={robotBlue} />
      </g>

      {/* Tablet/Screen */}
      <g id="tablet">
        <rect x="120" y="50" width="110" height="80" rx="10" ry="10" fill={accentYellow} stroke={robotBlue} strokeWidth="2" />
        {/* Screen details (simplified) */}
        <rect x="130" y="60" width="40" height="20" fill={screenDetailBlue} rx="3"/>
        <rect x="180" y="60" width="20" height="20" fill={screenDetailBlue} rx="3"/>
        <rect x="130" y="90" width="25" height="30" fill={screenDetailBlue} rx="3"/>
        <rect x="165" y="90" width="25" height="30" fill={highlightWhite} rx="3"/>
         {/* Vertical bars like a chart */}
        <rect x="200" y="90" width="8" height="30" fill={screenDetailBlue} />
        <rect x="212" y="100" width="8" height="20" fill={screenDetailBlue} />
         {/* Dots */}
        <circle cx="185" cy="90" r="2" fill={robotBlue} />
        <circle cx="185" cy="97" r="2" fill={robotBlue} />
        <circle cx="185" cy="104" r="2" fill={robotBlue} />
      </g>

      {/* Text "Ai Image Compare" */}
      <g id="logo-text">
        <text 
          x="150" 
          y="155" 
          fontFamily="Arial, Helvetica, sans-serif" 
          fontSize="22" 
          fontWeight="bold" 
          textAnchor="middle" 
          fill={accentYellow}
        >
          Ai Image
        </text>
        <text 
          x="150" 
          y="178" 
          fontFamily="Arial, Helvetica, sans-serif" 
          fontSize="22" 
          fontWeight="bold" 
          textAnchor="middle" 
          fill={accentYellow}
        >
          Compare
        </text>
      </g>
    </svg>
  );
};

export default CustomLogo;
