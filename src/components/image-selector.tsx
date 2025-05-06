
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Camera, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

interface ImageSelectorProps {
  onImageSelect: (dataUrl: string, fileName?: string, targetIndex?: number) => void; // Allow passing targetIndex
  disabled?: boolean;
  showUploadOption?: boolean;
}

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


const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelect, disabled = false, showUploadOption = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const { toast } = useToast();


  const stopCameraTracks = useCallback((streamToStop: MediaStream | null) => {
    if (streamToStop) {
      console.log("Stopping camera tracks...");
      streamToStop.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.id} (${track.label || 'N/A'}) stopped.`);
      });
    }
     if (videoRef.current && videoRef.current.srcObject === streamToStop) {
        videoRef.current.srcObject = null; // Crucial for releasing camera
        console.log("Video element srcObject cleared.");
     }
     setIsVideoReady(false); // Reset video readiness
  }, []);


  const startCamera = useCallback(async () => {
    if (disabled || (isCameraOpen && stream && hasCameraPermission === true)) {
        console.log("Camera start request ignored:", { disabled, isCameraOpen, streamExists: !!stream, permission: hasCameraPermission });
        return;
    }

    console.log("Attempting to start camera...");
    setIsCameraOpen(true);
    setHasCameraPermission(null); // Reset permission state
    setIsVideoReady(false); // Reset video ready state

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported by this browser.");
      toast({
        variant: 'destructive',
        title: 'Camera Not Supported',
        description: 'Your browser does not support camera access. Try a different browser or check settings.',
      });
      setHasCameraPermission(false);
      setIsCameraOpen(false);
      return;
    }

    if (stream) { // If a stream already exists, stop it first
      console.log("Existing stream found, stopping it before starting new one.");
      stopCameraTracks(stream);
      setStream(null); // Explicitly set stream to null
    }

    try {
       // Try common constraints, starting with environment (rear camera)
       const constraintsOptions = [
         { video: { facingMode: { exact: 'environment' } } }, // Prefer rear
         { video: { facingMode: 'user' } }, // Fallback to front
         { video: true } // Fallback to any video input
       ];

       let mediaStream: MediaStream | null = null;
       let lastError: any = null;

       for (const constraints of constraintsOptions) {
         try {
           console.log("Trying camera constraints:", JSON.stringify(constraints));
           mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
           console.log("Camera access successful with constraints:", JSON.stringify(constraints), `Stream ID: ${mediaStream?.id}`);
           lastError = null; // Clear last error if successful
           break; // Exit loop on success
         } catch (error) {
           lastError = error; // Store error to throw if all fail
           console.warn(`Failed with constraints: ${JSON.stringify(constraints)}. Error: ${error instanceof Error ? error.name : String(error)} - ${error instanceof Error ? error.message : ''}`);
         }
       }

       if (!mediaStream) { // If no stream obtained after trying all constraints
           console.error("All camera constraints failed. Last error:", lastError);
           throw lastError || new Error("No suitable camera found or access denied after trying options.");
       }
      
      setHasCameraPermission(true);
      setStream(mediaStream); // Set the new stream

       if (videoRef.current) {
            videoRef.current.srcObject = mediaStream; // Assign to video element
            // Event listeners for video element
            videoRef.current.onloadedmetadata = () => {
                console.log("Video metadata loaded. Attempting to play...");
                videoRef.current?.play().then(() => {
                    console.log("Video playback started.");
                     // Check dimensions shortly after play, as they might not be immediately available
                    setTimeout(() => {
                        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                            console.log(`Video dimensions ready: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                            setIsVideoReady(true);
                        } else {
                            console.warn("Video dimensions still not available after play started and timeout.");
                            // setIsVideoReady(false); // Keep it false or re-check
                        }
                    }, 200); // Increased delay for stability
                }).catch(playErr => {
                    console.error("Video play failed:", playErr);
                     toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not start camera preview. Autoplay might be blocked.' });
                    setIsVideoReady(false);
                });
            };
             videoRef.current.onerror = (e) => { // More robust error handling for video element
                console.error("Video element error event:", e, videoRef.current?.error);
                 toast({ variant: 'destructive', title: 'Video Playback Error', description: 'Could not display the camera feed. Try again or check camera.'});
                 stopCameraTracks(mediaStream); // Ensure tracks are stopped on video error
                 setStream(null);
                 setHasCameraPermission(false); // Reflect that camera is not usable
                 setIsVideoReady(false);
             };
             // Additional check for when video can truly play
             videoRef.current.oncanplay = () => {
                 console.log("Video canplay event triggered.");
                 if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                    console.log(`Video dimensions confirmed on canplay: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    setIsVideoReady(true); // Confirm video is ready here
                 } else {
                    console.warn("Video canplay triggered, but dimensions still 0x0.");
                 }
             };
       } else {
         console.warn("videoRef.current is null when stream was ready. This shouldn't happen. Stopping stream.");
         stopCameraTracks(mediaStream);
         setHasCameraPermission(false); // Indicate failure
         setIsVideoReady(false);
       }

    } catch (error) { // Catch errors from getUserMedia or constraint attempts
      console.error('Full error accessing camera:', error);
      let description = 'Could not access camera. Please ensure it\'s not in use by another app and permissions are allowed in browser settings.';
      if (error instanceof Error) {
        // Detailed error messages based on common error names
        if (error.name === 'NotAllowedError') {
          description = 'Camera access was denied. Please enable camera permissions in your browser settings and refresh the page.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          description = 'No camera found. Please ensure a camera is connected, enabled, and not disabled by system settings.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          description = 'Camera is currently in use by another application or there was a hardware error. Close other apps using the camera and try again.';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
             description = 'The camera does not meet the requested features (e.g., resolution, facing mode). Trying with default settings.';
        } else if (error.name === 'AbortError') {
             description = 'Camera access request was aborted, possibly due to a quick navigation or permissions change. Please try again.';
        } else if (error.name === 'SecurityError') {
             description = 'Camera access is blocked by browser security settings (e.g., requires HTTPS, or specific feature policy). Ensure the site is loaded over HTTPS if not on localhost.';
        } else if (error.name === 'TypeError') { // Can happen if constraints are malformed, though less likely with predefined ones
             description = 'There was an issue with the camera request (invalid settings).';
        }
      }
      setHasCameraPermission(false); // Set permission to false on any error
      toast({ variant: 'destructive', title: 'Camera Access Failed', description: description, duration: 9000 });
      
      // Ensure any potentially started stream is stopped on error
      // Use 'stream' state variable here, as 'mediaStream' is local to try block
      if (stream) {
          stopCameraTracks(stream);
          setStream(null);
      }
      setIsVideoReady(false);
      setIsCameraOpen(false); // Close camera UI on failure to prevent inconsistent state
    }
  }, [disabled, isCameraOpen, toast, stopCameraTracks, stream, hasCameraPermission]); // Added hasCameraPermission


  const handleStopCamera = useCallback(() => {
      console.log("handleStopCamera called. Current stream:", stream ? stream.id : "null");
      if (stream) {
        stopCameraTracks(stream);
        setStream(null); // Explicitly nullify stream state
      }
      setIsCameraOpen(false); // Close the camera UI
      setHasCameraPermission(null); // Reset permission state
      setIsVideoReady(false); // Reset video ready state
      console.log("Camera explicitly stopped and UI closed.");
  }, [stream, stopCameraTracks]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        onImageSelect(dataUrl, file.name); // Pass undefined for targetIndex to let parent decide
      } catch (error) {
        console.error("Error reading file:", error);
        toast({ title: "Read Error", description: "Could not read the selected file.", variant: "destructive" });
      }
    } else if (file) {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


 const takePicture = () => {
    if (!videoRef.current || !canvasRef.current || !stream || hasCameraPermission !== true || !isVideoReady) {
        console.warn("Take picture called but conditions not met:", {
            videoRefExists: !!videoRef.current,
            canvasRefExists: !!canvasRef.current,
            streamActive: !!stream,
            permission: hasCameraPermission,
            isVideoReady: isVideoReady,
            videoDimensions: videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'N/A'
        });
        toast({
            title: "Capture Error",
            description: hasCameraPermission === false
                ? "Camera permission denied. Please allow access and retry."
                : !isVideoReady
                ? "Camera feed is not ready yet. Please wait a moment for the video to load."
                : "Could not prepare for capture. Ensure the camera is active and try again.",
            variant: "destructive",
        });
        return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Use actual video dimensions for capture to maintain aspect ratio
    const captureWidth = video.videoWidth;
    const captureHeight = video.videoHeight;

    if (captureWidth <= 0 || captureHeight <= 0) {
        console.error(`Invalid capture dimensions from video feed: ${captureWidth}x${captureHeight}. Cannot take picture.`);
        toast({ title: "Capture Error", description: "Camera returned invalid video dimensions. Please try re-opening the camera.", variant: "destructive" });
        setIsVideoReady(false); // Mark as not ready if dimensions are bad
        return;
    }

    canvas.width = captureWidth;
    canvas.height = captureHeight;
    console.log(`Canvas dimensions set for capture: ${canvas.width}x${canvas.height}`);

    const context = canvas.getContext('2d');
    if (!context) {
        console.error("Could not get canvas 2D context for image capture.");
        toast({ title: "Canvas Error", description: "Internal error: Failed to prepare image capture context.", variant: "destructive" });
        return;
    }
    console.log("Canvas 2D context obtained for drawing.");

    try {
        console.log(`Attempting to draw video frame to canvas (${canvas.width}x${canvas.height})...`);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log("Video frame successfully drawn to canvas.");

        // Use image/jpeg for better compression than png for photos, with quality 0.9
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); 
        console.log(`Canvas toDataURL (JPEG) executed. Data URL length: ${dataUrl.length}`);

        if (!dataUrl || dataUrl === 'data:,') { // Check for empty or invalid data URL
            throw new Error("Canvas generated an empty or invalid data URL.");
        }

        console.log("Image captured successfully.");
        onImageSelect(dataUrl, `captured_image_${Date.now()}.jpg`); // Add timestamp for unique name
        handleStopCamera(); // Stop camera and close UI after successful capture

    } catch (error) { // Catch errors from drawImage or toDataURL
        console.error("Error during canvas drawImage or toDataURL for capture:", error);
        toast({
            title: "Capture Failed",
            description: `Could not capture image from camera. ${error instanceof Error ? error.message : 'Unknown canvas error'}. Please try again.`,
            variant: "destructive",
        });
    }
  };

  // Cleanup effect: runs when component unmounts or when `stream` or `stopCameraTracks` change
  useEffect(() => {
    const currentStream = stream; // Capture stream in a closure
    return () => {
      console.log("ImageSelector unmounting or stream changed, ensuring camera is stopped.");
      if (currentStream) {
        stopCameraTracks(currentStream);
      }
    };
  }, [stream, stopCameraTracks]);

  // Effect to manage video stream assignment to video element
  useEffect(() => {
      if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
          console.log("Assigning new stream to video element in effect.");
          videoRef.current.srcObject = stream;
          setIsVideoReady(false); // Reset readiness as new stream is assigned
      } else if (videoRef.current && !stream && videoRef.current.srcObject) {
          console.log("Stream is null in effect, clearing video element srcObject.");
          videoRef.current.srcObject = null;
          setIsVideoReady(false);
      }
  }, [stream]); // Re-run when stream changes


  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      {!isCameraOpen ? (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          {showUploadOption && (
              <>
                <Button onClick={handleUploadClick} variant="secondary" className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow" disabled={disabled}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                </Button>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/mp4,video/quicktime,video/x-matroska,video/webm" // More image types
                    className="hidden"
                    id="image-upload-selector-via-button" 
                    disabled={disabled}
                />
              </>
          )}
          <Button onClick={startCamera} variant="outline" className="w-full sm:w-auto border-border/70 hover:border-foreground transition-colors" disabled={disabled}>
            <Camera className="mr-2 h-4 w-4" /> Use Camera
          </Button>
        </div>
      ) : (
        // Camera View UI
        <div className="w-full flex flex-col items-center gap-4">
           <div className="relative w-full max-w-2xl border-2 border-border/50 rounded-lg overflow-hidden shadow-lg bg-muted aspect-video"> {/* Max-width for larger screens, aspect-video for 16:9 */}
                 <video
                    ref={videoRef}
                    className={cn(
                         'w-full h-full object-contain transition-opacity duration-300 bg-black', // object-contain to see full frame, bg-black for letterboxing
                         stream && hasCameraPermission === true && isVideoReady ? 'opacity-100' : 'opacity-0' 
                    )}
                    playsInline // Essential for iOS
                    autoPlay // Attempt autoplay
                    muted // Often required for autoplay
                 />
                {/* Overlays for loading/error states */}
                {hasCameraPermission === null && !stream && ( // Initializing
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <Camera className="h-12 w-12 text-muted-foreground animate-pulse mb-2" />
                        <p className="text-muted-foreground animate-pulse text-center font-medium">Initializing camera...</p>
                     </div>
                )}
                {hasCameraPermission === false && ( // Permission denied or error
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-destructive/10 backdrop-blur-sm">
                        <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
                        <Alert variant="destructive" className="max-w-sm border-none bg-transparent shadow-none">
                            <AlertTitle className="text-center font-semibold">Camera Access Problem</AlertTitle>
                            <AlertDescription className="text-center mt-1">
                                Please ensure camera permissions are allowed and no other app is using it.
                                <Button onClick={startCamera} variant="link" className="p-1 h-auto text-destructive dark:text-red-300 font-bold block mx-auto mt-1 hover:underline">Retry Access</Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                {stream && hasCameraPermission === true && !isVideoReady && ( // Stream obtained, but video not ready
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <Camera className="h-12 w-12 text-muted-foreground animate-pulse mb-2" />
                        <p className="text-muted-foreground animate-pulse font-medium">Loading camera feed...</p>
                         <p className="text-xs text-muted-foreground/70 mt-1">Ensure your camera is uncovered.</p>
                    </div>
                )}
            </div>
          <canvas ref={canvasRef} className="hidden"></canvas> {/* Keep canvas hidden, used for capture */}

          {hasCameraPermission === true && stream && (
              <Button
                onClick={takePicture}
                className="w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-transform hover:scale-105"
                disabled={!isVideoReady || disabled} 
                 aria-disabled={!isVideoReady || disabled}
                 title={!isVideoReady ? "Waiting for camera feed to become ready..." : "Capture Image"}
              >
                <Camera className="mr-2 h-4 w-4" />
                 {isVideoReady ? 'Capture Image' : 'Preparing Camera...'}
              </Button>
          )}

          <Button onClick={handleStopCamera} variant="outline" className="w-full max-w-xs border-border/70 hover:border-destructive hover:text-destructive-foreground hover:bg-destructive/10 transition-colors">
             Cancel Camera
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
