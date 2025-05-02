
"use client";

import React, { useEffect } from 'react';

const CursorLightEffect: React.FC = () => {
  useEffect(() => {
    const updateCursorPosition = (event: MouseEvent) => {
      // Use requestAnimationFrame for performance
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
      });
    };

    // Add listener only on the client side
    window.addEventListener('mousemove', updateCursorPosition);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('mousemove', updateCursorPosition);
      // Optionally reset CSS variables on cleanup
      // document.documentElement.style.removeProperty('--cursor-x');
      // document.documentElement.style.removeProperty('--cursor-y');
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // This component doesn't render anything visible itself
  return null;
};

export default CursorLightEffect;
