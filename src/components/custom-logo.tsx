// src/components/custom-logo.tsx
import React from 'react';

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {}

const CustomLogo: React.FC<CustomLogoProps> = (props) => {
  // Using white for text as per the image, background is transparent by default for SVG
  const textColor = "#FFFFFF"; 

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 100" // Adjusted viewBox for a more rectangular logo
      {...props}
    >
      {/* Optional: Add a black background rectangle if the logo must always be on black */}
      {/* <rect width="200" height="100" fill="#000000" /> */}
      
      {/* Text "AI IMAGE" */}
      <text
        x="50%" // Centered
        y="40%" // Positioned towards the top
        fontFamily="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" // Impact-like font
        fontSize="30" // Adjust size as needed
        fontWeight="bold"
        fill={textColor}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="-1"
      >
        AI IMAGE
      </text>

      {/* Text "- COMPARE -" */}
      <text
        x="50%" // Centered
        y="70%" // Positioned below "AI IMAGE"
        fontFamily="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" // Impact-like font
        fontSize="24" // Adjust size as needed
        fontWeight="normal" // Or bold, depending on desired look
        fill={textColor}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="1"
      >
        - COMPARE -
      </text>
    </svg>
  );
};

export default CustomLogo;
