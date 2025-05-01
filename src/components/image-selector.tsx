"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ImageSelectorProps {
  onImageSelect: (imageUrl: string) => void;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageSelect(imageUrl);
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
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        setIsCameraOpen(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Wait for metadata to load before playing to get correct dimensions
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
          }
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        toast({
          title: "Camera Error",
          description: "Could not access the camera. Please check permissions.",
          variant: "destructive",
        });
        setIsCameraOpen(false); // Ensure camera state is reset on error
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
    }
    setIsCameraOpen(false);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
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
             onImageSelect(imageUrl);
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
    }
  };

  // Clean up camera stream on component unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);


  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      {!isCameraOpen ? (
        <>
          <Button onClick={handleUploadClick} variant="outline" className="w-full glassmorphic border-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground">
            <Upload className="mr-2 h-4 w-4" /> Upload Image
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden" // Hide the default input
            id="image-upload"
          />
          <Label htmlFor="image-upload" className="sr-only">Upload Image</Label>

          <Button onClick={startCamera} variant="outline" className="w-full glassmorphic border-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground">
            <Camera className="mr-2 h-4 w-4" /> Use Camera
          </Button>
        </>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Video element initially hidden until stream is ready */}
          <video ref={videoRef} className={`w-full max-w-md rounded-lg ${stream ? 'block' : 'hidden'}`} playsInline />
          <canvas ref={canvasRef} className="hidden"></canvas>
          <div className="flex flex-col gap-4 w-full max-w-xs justify-center">
            <Button onClick={takePicture} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Camera className="mr-2 h-4 w-4" /> Capture
            </Button>
            <Button onClick={stopCamera} variant="destructive" className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
