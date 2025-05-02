
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils'; // Import the cn function

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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null: initial, true: granted, false: denied/error
  const { toast } = useToast();


  // Memoize stopCamera - ensure cleanup happens reliably
  const stopCamera = useCallback(() => {
    console.log("Attempting to stop camera...");
    let tracksStopped = false;
    // Stop stream tracks if stream state exists
    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
            tracksStopped = true;
        });
        setStream(null); // Clear stream state
        console.log("Stream state tracks stopped and cleared.");
    }
    // Explicitly stop tracks from video element's srcObject just in case
    if (videoRef.current && videoRef.current.srcObject) {
        const currentSrcObject = videoRef.current.srcObject as MediaStream;
        currentSrcObject.getTracks().forEach(track => {
             if (track.readyState === 'live') { // Only stop live tracks
                track.stop();
                tracksStopped = true;
            }
        });
        videoRef.current.srcObject = null; // Clear the video source
        console.log("Video element srcObject tracks stopped and cleared.");
    } else if (videoRef.current) {
         console.log("Video element exists but has no srcObject to stop.");
    }

    if (tracksStopped) {
        console.log("Camera tracks stopped.");
    } else {
        console.log("No active camera tracks found to stop.");
    }

    setIsCameraOpen(false); // Ensure UI closes
    // Don't automatically reset hasCameraPermission here - user might retry
  }, [stream]); // Dependency only on stream state


   // Request and handle camera permission
  const getCameraPermission = useCallback(async (isRetry = false) => {
    // Reset state if retrying after denial/error
    if (isRetry) {
        console.log("Retrying camera permission request...");
        setHasCameraPermission(null); // Reset to initial state for retry feedback
        stopCamera(); // Ensure any previous stream is stopped before retrying
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before requesting again
    } else if (hasCameraPermission === true) {
         console.log("Camera permission already granted.");
         return true; // Already have permission
    }


    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported");
      toast({
        variant: 'destructive',
        title: 'Camera Not Supported',
        description: 'Your browser does not support camera access.',
      });
      setHasCameraPermission(false);
      return false;
    }

    try {
      console.log("Requesting camera permission...");
       // Try environment camera first, fallback to default
       const constraints = { video: { facingMode: 'environment' } };
       let mediaStream: MediaStream;
       try {
           mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
           console.log("Environment camera accessed.");
       } catch (err) {
           console.warn("Environment camera failed, trying default:", err);
           mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
           console.log("Default camera accessed.");
       }

      console.log("Camera permission granted.");
      setHasCameraPermission(true);
      setStream(mediaStream); // Set stream state

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded.");
            videoRef.current?.play().catch(playErr => {
                console.error("Video play failed:", playErr);
                toast({
                    variant: 'destructive',
                    title: 'Camera Error',
                    description: 'Could not start camera preview. It might be in use.',
                 });
            });
        };
        videoRef.current.onerror = (e) => {
          console.error("Video element error:", e);
          toast({
            variant: 'destructive',
            title: 'Video Playback Error',
            description: 'Could not display the camera feed.',
          });
          stopCamera(); // Stop camera on video error
          setHasCameraPermission(false); // Set permission state to error
        };
      } else {
         console.warn("videoRef.current is null when trying to set srcObject");
         // Stop the obtained stream if video element is not available
         mediaStream.getTracks().forEach(track => track.stop());
         setHasCameraPermission(false); // Indicate error state
         return false;
      }
      return true; // Permission granted and stream assigned

    } catch (error) {
      console.error('Error accessing camera:', error);
      let description = 'Could not access camera. Please ensure it\'s not in use and permissions are allowed.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          description = 'Camera access was denied. Please enable permissions in your browser settings and retry.';
        } else if (error.name === 'NotFoundError') {
          description = 'No camera found. Please ensure a camera is connected and enabled.';
        } else if (error.name === 'NotReadableError') {
          description = 'Camera is currently in use or there was a hardware error. Please close other apps using the camera and retry.';
        } else if (error.name === 'AbortError') {
             description = 'Camera access request was aborted. Please try again.';
        } else if (error.name === 'SecurityError') {
             description = 'Camera access is blocked by browser security settings (e.g., in an insecure context).';
        } else if (error.name === 'TypeError') {
             description = 'Invalid camera constraints requested.'; // Should not happen with simple constraints
        }
      }
      setHasCameraPermission(false); // Set to false on any error
      toast({
        variant: 'destructive',
        title: 'Camera Access Failed',
        description: description,
        duration: 7000, // Show longer
      });
      stopCamera(); // Ensure cleanup on failure
      return false;
    }
  }, [hasCameraPermission, toast, stopCamera]); // Include stopCamera


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

  // Start camera flow
  const startCamera = async () => {
     if (disabled) return;
     setIsCameraOpen(true); // Open UI first
     await getCameraPermission(); // Request permission
     // UI state (like showing error message) is handled by hasCameraPermission state changes
  };

  const takePicture = () => {
    // Ensure all conditions are met
     if (!videoRef.current || !canvasRef.current || !stream || hasCameraPermission !== true || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
         console.warn("Take picture called but conditions not met:", {
             videoReady: !!videoRef.current?.videoWidth,
             canvasReady: !!canvasRef.current,
             streamActive: !!stream,
             permission: hasCameraPermission
         });
         toast({
             title: "Capture Error",
             description: hasCameraPermission === false
                 ? "Camera permission denied. Please allow access."
                 : "Camera is not ready. Please wait or try again.",
             variant: "destructive",
         });
         return;
     }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
        console.error("Could not get canvas context.");
        toast({
            title: "Canvas Error",
            description: "Internal error preparing image capture.",
            variant: "destructive",
        });
        return;
    }

    try {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image as data URL
        const dataUrl = canvas.toDataURL('image/jpeg'); // Use JPEG for smaller size typically

        if (!dataUrl || dataUrl === 'data:,') {
            throw new Error("Canvas returned empty data URL.");
        }

        onImageSelect(dataUrl, 'captured_image.jpg'); // Pass data URL
        stopCamera(); // Close camera after successful capture

    } catch (error) {
        console.error("Error capturing or processing image:", error);
        toast({
            title: "Capture Failed",
            description: `Could not capture image from camera feed. ${error instanceof Error ? error.message : ''}`,
            variant: "destructive",
        });
        // Optionally stop camera even on failure, or allow retry
        // stopCamera();
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
           <div className="relative w-full max-w-md border-2 border-border/50 rounded-lg overflow-hidden shadow-md bg-muted"> {/* Added background */}
             <div className={`w-full aspect-video flex items-center justify-center`}> {/* Always render container */}
                 {/* Video element - Render it but control visibility/source */}
                 <video
                    ref={videoRef}
                     // Conditionally apply classes, ensure it's always in DOM for ref
                    className={cn(
                         'w-full h-full object-cover transition-opacity duration-300',
                         stream && hasCameraPermission === true ? 'opacity-100' : 'opacity-0' // Fade in/out
                    )}
                    playsInline
                    autoPlay // Let useEffect handle play via onloadedmetadata
                    muted
                 />

                 {/* Loading/Initializing State */}
                {hasCameraPermission === null && (
                     <div className="absolute inset-0 flex items-center justify-center p-4">
                        <p className="text-muted-foreground animate-pulse text-center">Initializing camera...</p>
                     </div>
                )}

                 {/* Permission Denied/Error State */}
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <Alert variant="destructive" className="max-w-sm border-destructive/50 bg-destructive/10">
                            <AlertTitle className="text-center font-semibold">Camera Access Required</AlertTitle>
                            <AlertDescription className="text-center mt-2">
                                Please allow camera access in browser settings.
                                {/* Pass isRetry=true to getCameraPermission */}
                                <Button onClick={() => getCameraPermission(true)} variant="link" className="p-1 h-auto text-destructive dark:text-red-400 font-bold block mx-auto mt-1">Retry Permission</Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* Capture button enabled only when stream is active and permission granted */}
          {hasCameraPermission === true && stream && (
              <Button
                onClick={takePicture}
                className="w-full max-w-xs bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105" // Accent button with effects
                 // Disable until video has dimensions, indicating readiness
                disabled={!videoRef.current?.videoWidth || !videoRef.current?.videoHeight}
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
