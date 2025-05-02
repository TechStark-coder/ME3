
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
  const [isVideoReady, setIsVideoReady] = useState(false); // Track if video element has dimensions
  const { toast } = useToast();


  // Cleanup function to stop camera tracks
  const stopCameraTracks = useCallback((streamToStop: MediaStream | null) => {
    if (streamToStop) {
      console.log("Stopping camera tracks...");
      streamToStop.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.id} stopped.`);
      });
    }
     // Also clear video srcObject if it matches the stopped stream
     if (videoRef.current && videoRef.current.srcObject === streamToStop) {
        videoRef.current.srcObject = null;
        console.log("Video element srcObject cleared.");
     }
     setIsVideoReady(false); // Reset video ready state
  }, []);


  // Start camera flow - simplified request
  const startCamera = useCallback(async () => {
    // Prevent starting if disabled or already open and running
    if (disabled || (isCameraOpen && stream && hasCameraPermission === true)) return;

    console.log("Attempting to start camera...");
    setIsCameraOpen(true); // Show camera UI
    setHasCameraPermission(null); // Indicate loading state
    setIsVideoReady(false); // Reset video ready state

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported");
      toast({
        variant: 'destructive',
        title: 'Camera Not Supported',
        description: 'Your browser does not support camera access.',
      });
      setHasCameraPermission(false);
      setIsCameraOpen(false); // Hide UI if not supported
      return;
    }

    // Stop any existing stream before requesting a new one
    if (stream) {
      stopCameraTracks(stream);
      setStream(null);
    }


    try {
       // Try common constraints: environment (back), then user (front), then default
       const constraintsOptions = [
         { video: { facingMode: 'environment' } },
         { video: { facingMode: 'user' } },
         { video: true } // Default
       ];

       let mediaStream: MediaStream | null = null;
       let lastError: any = null;

       for (const constraints of constraintsOptions) {
         try {
           console.log("Trying constraints:", JSON.stringify(constraints));
           mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
           console.log("Camera access successful with constraints:", JSON.stringify(constraints));
           lastError = null; // Reset error if successful
           break; // Exit loop on success
         } catch (error) {
           lastError = error;
           console.warn(`Failed with constraints: ${JSON.stringify(constraints)}. Error: ${error instanceof Error ? error.name : String(error)}`);
         }
       }

       if (!mediaStream) {
            // If all attempts failed, throw the last error
           throw lastError || new Error("No suitable camera found or access denied.");
       }


      console.log("Camera permission granted and stream obtained.");
      setHasCameraPermission(true);
      setStream(mediaStream); // Store the stream

      // Assign stream to video element *after* state is set
       if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;

            videoRef.current.onloadedmetadata = () => {
                console.log("Video metadata loaded.");
                // Attempt to play after metadata is loaded
                videoRef.current?.play().then(() => {
                    console.log("Video playing.");
                    // Check dimensions after play starts successfully
                    // Using a small timeout to allow rendering and dimension calculation
                     setTimeout(() => {
                        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                            console.log(`Video dimensions available: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                            setIsVideoReady(true); // Set video ready state
                        } else {
                            console.warn("Video dimensions not available after play started.");
                            setIsVideoReady(false);
                        }
                    }, 100); // Adjust timeout if needed

                }).catch(playErr => {
                    console.error("Video play failed:", playErr);
                     toast({
                        variant: 'destructive',
                        title: 'Camera Error',
                        description: 'Could not start camera preview. Autoplay might be blocked.',
                    });
                    setIsVideoReady(false);
                });
            };
             videoRef.current.onerror = (e) => {
                console.error("Video element error:", e);
                 toast({
                   variant: 'destructive',
                   title: 'Video Playback Error',
                   description: 'Could not display the camera feed.',
                 });
                 stopCameraTracks(mediaStream); // Stop stream on video error
                 setStream(null);
                 setHasCameraPermission(false); // Indicate error state
                 setIsVideoReady(false);
             };
             // Add listener for 'canplay' event as another check for readiness
             videoRef.current.oncanplay = () => {
                 console.log("Video can play.");
                 if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                    console.log(`Video dimensions confirmed on canplay: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    setIsVideoReady(true);
                 }
             };
       } else {
         console.warn("videoRef.current is null when stream ready. Stopping stream.");
         stopCameraTracks(mediaStream); // Stop the obtained stream if video element isn't available
         setHasCameraPermission(false); // Indicate error state
         setIsVideoReady(false);
       }

    } catch (error) {
      console.error('Error accessing camera:', error);
      let description = 'Could not access camera. Please ensure it\'s not in use and permissions are allowed.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          description = 'Camera access was denied. Please enable permissions in your browser settings and refresh.';
        } else if (error.name === 'NotFoundError') {
          description = 'No camera found. Please ensure a camera is connected and enabled.';
        } else if (error.name === 'NotReadableError') {
          description = 'Camera is currently in use or there was a hardware error. Close other apps using the camera and refresh.';
        } else if (error.name === 'AbortError') {
             description = 'Camera access request was aborted. Please try again.';
        } else if (error.name === 'SecurityError') {
             description = 'Camera access is blocked by browser settings (e.g., requires HTTPS).';
        } else if (error.name === 'TypeError') {
             description = 'Invalid camera constraints requested.';
        }
      }
      setHasCameraPermission(false); // Set to false on any error
      toast({
        variant: 'destructive',
        title: 'Camera Access Failed',
        description: description,
        duration: 9000, // Show longer
      });
      // Keep camera UI open on error for retry
      stopCameraTracks(stream); // Ensure cleanup
      setStream(null);
      setIsVideoReady(false);
    }
  }, [disabled, isCameraOpen, hasCameraPermission, toast, stream, stopCameraTracks]); // Added isCameraOpen

   // Function to explicitly stop the camera and close UI
  const handleStopCamera = useCallback(() => {
      stopCameraTracks(stream);
      setStream(null);
      setIsCameraOpen(false);
      setHasCameraPermission(null); // Reset permission state
      setIsVideoReady(false); // Reset video ready state
      console.log("Camera explicitly stopped and UI closed.");
  }, [stream, stopCameraTracks]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        // Use the actual file name
        onImageSelect(dataUrl, file.name);
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


 const takePicture = () => {
    // Enhanced checks for readiness
    if (!videoRef.current || !canvasRef.current || !stream || hasCameraPermission !== true || !isVideoReady) {
        console.warn("Take picture called but conditions not met:", {
            videoRefExists: !!videoRef.current,
            canvasRefExists: !!canvasRef.current,
            streamActive: !!stream,
            permission: hasCameraPermission,
            isVideoReady: isVideoReady, // Check our state
            videoDimensions: videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'N/A'
        });
        toast({
            title: "Capture Error",
            description: hasCameraPermission === false
                ? "Camera permission denied. Please allow access."
                : !isVideoReady
                ? "Camera feed is not ready yet. Please wait a moment."
                : "Could not prepare for capture. Please try again.",
            variant: "destructive",
        });
        return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Use videoWidth/Height as primary source now that isVideoReady confirms they are > 0
    const captureWidth = video.videoWidth;
    const captureHeight = video.videoHeight;

    if (captureWidth <= 0 || captureHeight <= 0) {
        console.error(`Invalid capture dimensions: ${captureWidth}x${captureHeight}`);
        toast({ title: "Capture Error", description: "Camera returned invalid video dimensions.", variant: "destructive" });
        return;
    }


    canvas.width = captureWidth;
    canvas.height = captureHeight;
    console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);

    // Get 2D context
    const context = canvas.getContext('2d');
    if (!context) {
        console.error("Could not get canvas 2D context.");
        toast({
            title: "Canvas Error",
            description: "Internal error preparing image capture context.",
            variant: "destructive",
        });
        return;
    }
    console.log("Canvas 2D context obtained.");


    try {
        // Draw video frame to canvas
        console.log(`Drawing video frame to canvas (${canvas.width}x${canvas.height})...`);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log("Video frame drawn to canvas.");

        // Get image as data URL (JPEG recommended for size)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Quality 0.9
        console.log(`Canvas toDataURL executed. Length: ${dataUrl.length}`);

        if (!dataUrl || dataUrl === 'data:,') {
            throw new Error("Canvas returned empty or invalid data URL.");
        }

        console.log("Image captured successfully.");
        onImageSelect(dataUrl, 'captured_image.jpg'); // Pass data URL and a filename
        handleStopCamera(); // Close camera after successful capture

    } catch (error) {
        console.error("Error during canvas drawImage or toDataURL:", error);
        toast({
            title: "Capture Failed",
            description: `Could not capture image from camera feed. ${error instanceof Error ? error.message : 'Unknown canvas error'}`,
            variant: "destructive",
        });
        // Consider if camera should be stopped on failure or allow retry
        // handleStopCamera();
    }
  };

  // Cleanup camera stream on component unmount
  useEffect(() => {
    // This is the cleanup function that runs when the component unmounts
    return () => {
      console.log("ImageSelector unmounting, ensuring camera is stopped.");
      stopCameraTracks(stream);
    };
  }, [stream, stopCameraTracks]); // Depend on stream state and the cleanup function itself

  // Effect to handle assignment of stream to video element
  // This runs when `stream` state changes
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      console.log("Assigning new stream to video element.");
      videoRef.current.srcObject = stream;
      setIsVideoReady(false); // Reset ready state when stream changes
       // Play attempt is handled in startCamera's onloadedmetadata
    } else if (videoRef.current && !stream && videoRef.current.srcObject) {
        console.log("Clearing video element srcObject because stream is null.");
        videoRef.current.srcObject = null;
        setIsVideoReady(false); // Reset ready state
    }
  }, [stream]);


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
                         // Show video only when stream exists AND permission is confirmed true
                         stream && hasCameraPermission === true ? 'opacity-100' : 'opacity-0' // Fade in/out
                    )}
                    playsInline // Essential for mobile
                    // autoPlay // Let useEffect/startCamera handle play()
                    muted // Required for autoplay in most browsers
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
                                Please allow camera access and ensure it's not in use.
                                {/* Retry button calls startCamera again */}
                                <Button onClick={startCamera} variant="link" className="p-1 h-auto text-destructive dark:text-red-400 font-bold block mx-auto mt-1">Retry</Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </div>
          </div>

          {/* Hidden canvas for capturing frame */}
          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* Capture button enabled only when camera is ready */}
          {hasCameraPermission === true && stream && (
              <Button
                onClick={takePicture}
                className="w-full max-w-xs bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105" // Accent button with effects
                 // Disable button until video is ready (has dimensions and can play)
                disabled={!isVideoReady}
                 aria-disabled={!isVideoReady} // Accessibility
                 title={!isVideoReady ? "Waiting for camera feed..." : "Capture Image"}
              >
                <Camera className="mr-2 h-4 w-4" />
                 {isVideoReady ? 'Capture Image' : 'Preparing Camera...'}
              </Button>
          )}

          {/* Always show Cancel button when camera UI is open */}
          <Button onClick={handleStopCamera} variant="outline" className="w-full max-w-xs border-border/70 hover:border-foreground transition-colors">
             Cancel
          </Button>

        </div>
      )}
    </div>
  );
};

export default ImageSelector;

