
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImageSelectorProps {
  // Update prop type to expect a data URI
  onImageSelect: (dataUrl: string, fileName?: string) => void;
  disabled?: boolean;
}

// Helper function to read file as Data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelect, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Memoize getCameraPermission
  const getCameraPermission = useCallback(async () => {
    // Quick exit if already have permission
    if (hasCameraPermission === true) return true;
     // Reset permission state to null if retrying after denial
     if (hasCameraPermission === false) {
        setHasCameraPermission(null);
    }

    try {
      console.log("Requesting camera permission...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      console.log("Camera permission granted.");
      setHasCameraPermission(true);
      setStream(mediaStream);
      if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Ensure video plays when metadata is loaded
          videoRef.current.onloadedmetadata = () => {
             console.log("Video metadata loaded, attempting to play...");
             videoRef.current?.play().catch(err => {
                 console.error("Video play failed:", err);
                 // Attempt to play again after a short delay or user interaction might be needed
             });
          };
           // Add an error handler for the video element
          videoRef.current.onerror = (e) => {
              console.error("Video element error:", e);
              // Potentially show a more specific error to the user
               toast({
                 variant: 'destructive',
                 title: 'Video Playback Error',
                 description: 'Could not display the camera feed.',
              });
          };
      }
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
       let description = 'Please enable camera permissions in your browser settings.';
       if (error instanceof Error) {
           if (error.name === 'NotAllowedError') {
               description = 'Camera access was denied. Please enable permissions in your browser settings.';
           } else if (error.name === 'NotFoundError') {
               description = 'No camera found. Please ensure a camera is connected and enabled.';
           } else if (error.name === 'NotReadableError') {
               description = 'Camera is already in use or there was a hardware error.';
           }
       }
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Failed',
        description: description,
      });
      stopCamera(); // Cleanup on failure
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraPermission, toast]); // Removed stopCamera from deps

    // Memoize stopCamera
  const stopCamera = useCallback(() => {
    console.log("Stopping camera...");
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      console.log("Stream tracks stopped.");
    }
    if (videoRef.current) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream?.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null; // Clear the video source
        console.log("Video source cleared and tracks stopped.");
    }
    setStream(null);
    setIsCameraOpen(false);
    // Don't reset hasCameraPermission here automatically
    console.log("Camera stopped, state updated.");
  }, [stream]); // Removed videoRef.current from dependencies


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        onImageSelect(dataUrl, file.name); // Pass data URL and file name
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          title: "Read Error",
          description: "Could not read the selected file.",
          variant: "destructive",
        });
      }
    } else if (file) {
        toast({
            title: "Invalid File Type",
            description: "Please select an image file (e.g., JPG, PNG, WEBP).",
            variant: "destructive",
        });
    }
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const startCamera = async () => {
     if (disabled) return; // Don't start if disabled

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setIsCameraOpen(true);
        const permissionGranted = await getCameraPermission();
        if (!permissionGranted) {
            // If permission was explicitly denied or failed, keep camera UI open but show error
             // setIsCameraOpen(false); // Don't close immediately, show the error state
        }
    } else {
       toast({
         title: "Camera Not Supported",
         description: "Your browser does not support camera access.",
         variant: "destructive",
       });
       setIsCameraOpen(false); // Close if feature not supported
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current && stream && hasCameraPermission === true) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        try {
            // Flip the image horizontally if it's from the front camera (optional)
            // if (video.srcObject && video.srcObject.getVideoTracks()[0].getSettings().facingMode === 'user') {
            //     context.translate(canvas.width, 0);
            //     context.scale(-1, 1);
            // }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Get image as data URL directly
            const dataUrl = canvas.toDataURL('image/jpeg'); // Or 'image/png'
            if (dataUrl && dataUrl !== 'data:,') { // Check if canvas is not blank
                 onImageSelect(dataUrl, 'captured_image.jpg'); // Pass data URL
                 stopCamera(); // Close camera after taking picture
            } else {
                 throw new Error("Canvas returned empty data URL.");
            }
        } catch (error) {
             console.error("Error capturing or processing image:", error);
             toast({
                 title: "Capture Failed",
                 description: "Could not capture image from camera feed. Please try again.",
                 variant: "destructive",
             });
        }
      } else {
          toast({
            title: "Canvas Error",
            description: "Could not get canvas context.",
            variant: "destructive",
         });
      }
    } else {
         console.warn("Take picture called but conditions not met:", { stream, hasCameraPermission });
         toast({
            title: "Capture Error",
            description: "Camera is not ready or permission denied.",
            variant: "destructive",
         });
    }
  };

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]); // Use memoized stopCamera

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      {!isCameraOpen ? (
        <>
           {/* Use slightly different variants for visual hierarchy */}
          <Button onClick={handleUploadClick} variant="secondary" className="w-full shadow-sm hover:shadow-md transition-shadow" disabled={disabled}>
            <Upload className="mr-2 h-4 w-4" /> Upload Image
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="image-upload"
            disabled={disabled}
          />
          <Button onClick={startCamera} variant="outline" className="w-full border-border/70 hover:border-foreground transition-colors" disabled={disabled}>
            <Camera className="mr-2 h-4 w-4" /> Use Camera
          </Button>
        </>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
           <div className="relative w-full max-w-md border-2 border-border/50 rounded-lg overflow-hidden shadow-md"> {/* Added border/shadow */}
             {/* Video should ideally be rendered conditionally or styles adjusted
                 to avoid layout shifts and potential issues if srcObject is briefly null */}
             <div className={`w-full aspect-video bg-muted flex items-center justify-center`}> {/* Always flex container */}
                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${stream && hasCameraPermission === true ? 'block' : 'hidden'}`} // More reliable hiding
                    playsInline
                    autoPlay // Let useEffect handle play via onloadedmetadata
                    muted
                 />

                 {/* Alert shown when permission is denied */}
                {hasCameraPermission === false && (
                    <Alert variant="destructive" className="m-4 border-destructive/50 bg-destructive/10"> {/* Styled Alert */}
                        <AlertTitle className="text-center font-semibold">Camera Access Required</AlertTitle>
                        <AlertDescription className="text-center mt-2">
                            Please allow camera access in browser settings.
                            <Button onClick={getCameraPermission} variant="link" className="p-1 h-auto text-destructive dark:text-red-400 font-bold block mx-auto mt-1">Retry Permission</Button>
                        </AlertDescription>
                    </Alert>
                )}

                 {/* Placeholder/Loading state while checking permission/initializing */}
                {hasCameraPermission === null && (
                     <div className="w-full h-full flex items-center justify-center p-4">
                        <p className="text-muted-foreground animate-pulse text-center">Initializing camera...</p>
                     </div>
                )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* Capture button enabled only when ready */}
          {hasCameraPermission === true && stream && (
              <Button
                onClick={takePicture}
                className="w-full max-w-xs bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105" // Accent button with effects
                disabled={!stream || !videoRef.current?.videoWidth} // Disable until video has dimensions
              >
                <Camera className="mr-2 h-4 w-4" /> Capture Image
              </Button>
          )}

          {/* Always show Cancel button when camera UI is open */}
          <Button onClick={stopCamera} variant="outline" className="w-full max-w-xs border-border/70 hover:border-foreground transition-colors">
             Cancel
          </Button>

        </div>
      )}
    </div>
  );
};

export default ImageSelector;
