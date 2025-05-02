
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label'; // Removed unused Label
import { Upload, Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert imports


interface ImageSelectorProps {
  // Updated callback to accept an optional filename
  onImageSelect: (imageUrl: string, fileName?: string) => void;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // Track permission explicitly
  const { toast } = useToast();

  // Request camera permission when 'Use Camera' is clicked or camera is opened
  const getCameraPermission = async () => {
      if (hasCameraPermission === true) return true; // Already have permission

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        setStream(mediaStream); // Set the stream state here
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => console.error("Video play failed:", err));
          };
        }
        return true; // Indicate success
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        stopCamera(); // Ensure cleanup if permission fails
        return false; // Indicate failure
      }
    };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      // Pass the file name to the callback
      onImageSelect(imageUrl, file.name);
    } else if (file) {
        toast({
            title: "Invalid File Type",
            description: "Please select an image file.",
            variant: "destructive",
        });
    }
     // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setIsCameraOpen(true); // Set state to show video/capture UI
        const permissionGranted = await getCameraPermission();
        if (!permissionGranted) {
            setIsCameraOpen(false); // Revert UI state if permission failed
        }
    } else {
       toast({
         title: "Camera Not Supported",
         description: "Your browser does not support camera access.",
         variant: "destructive",
       });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if(videoRef.current){
        videoRef.current.srcObject = null; // Clear the video source
        const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
        tracks?.forEach(track => track.stop()); // Ensure tracks are stopped
    }
    setIsCameraOpen(false);
    // Don't reset hasCameraPermission here, user might retry
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Set canvas dimensions based on video intrinsic dimensions for correct aspect ratio
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert canvas content to a data URL (or blob URL for better performance)
        canvas.toBlob(blob => {
           if (blob) {
             const imageUrl = URL.createObjectURL(blob);
             // Pass a generic message for captured images
             onImageSelect(imageUrl, 'captured_image.jpg');
             stopCamera(); // Close camera after taking picture
           } else {
               toast({
                   title: "Capture Failed",
                   description: "Could not capture image from camera.",
                   variant: "destructive",
               });
           }
        }, 'image/jpeg'); // Specify image format if needed
      }
    } else {
         toast({
            title: "Capture Error",
            description: "Camera stream not available or canvas error.",
            variant: "destructive",
         });
    }
  };

  // Clean up camera stream on component unmount
  useEffect(() => {
    return () => {
      stopCamera(); // Use stopCamera for comprehensive cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only on unmount

  return (
    // Updated to flex-col for vertical button arrangement
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      {!isCameraOpen ? (
        <>
          {/* Ensure buttons are always visible */}
          <Button onClick={handleUploadClick} variant="secondary" className="w-full">
            <Upload className="mr-2 h-4 w-4" /> Upload Image
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden" // Keep default input hidden
            id="image-upload"
          />
          {/* <Label htmlFor="image-upload" className="sr-only">Upload Image</Label> */} {/* Removed unused Label */}

          {/* Ensure buttons are always visible */}
          <Button onClick={startCamera} variant="secondary" className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Use Camera
          </Button>
        </>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Video element always rendered, visibility controlled by CSS */}
          <div className="relative w-full max-w-md">
            <video
                ref={videoRef}
                className={`w-full aspect-video rounded-lg bg-muted ${stream && hasCameraPermission ? 'block' : 'hidden'}`} // Show only if stream and permission exist
                playsInline // Essential for iOS
                autoPlay // Autoplay when stream is ready
                muted // Mute to allow autoplay without user interaction
             />
            {/* Alert shown when permission is denied */}
            {hasCameraPermission === false && (
                <Alert variant="destructive" className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription className="text-center">
                        Please allow camera access in your browser settings to use this feature.
                        <Button onClick={getCameraPermission} variant="link" className="p-0 h-auto text-destructive dark:text-destructive">Retry</Button>
                    </AlertDescription>
                </Alert>
            )}
            {/* Placeholder/Loading state */}
            {hasCameraPermission === null && !stream && (
                 <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">Initializing camera...</p>
                 </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>
          {/* Buttons shown only if camera permission is granted */}
          {hasCameraPermission === true && stream && (
              <div className="flex flex-col gap-4 w-full max-w-xs justify-center">
                <Button onClick={takePicture} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Camera className="mr-2 h-4 w-4" /> Capture
                </Button>
                <Button onClick={stopCamera} variant="outline" className="w-full">
                  Cancel
                </Button>
              </div>
          )}
           {/* Show Cancel button even if permission is denied to allow user to go back */}
          {hasCameraPermission !== true && (
             <Button onClick={stopCamera} variant="outline" className="w-full max-w-xs">
                 Cancel
             </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
