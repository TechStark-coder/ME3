
"use client";

import { useEffect } from 'react';

const CursorLightEffect = () => {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Update CSS variables with cursor coordinates
      document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
    };

    // Add event listener when the component mounts
    window.addEventListener('mousemove', handleMouseMove);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      // Optional: Reset CSS variables on unmount if needed
      // document.documentElement.style.removeProperty('--cursor-x');
      // document.documentElement.style.removeProperty('--cursor-y');
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  // This component doesn't render anything itself, it just manages the effect
  return null;
};

export default CursorLightEffect;
