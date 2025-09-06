import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface CameraViewProps {
  onImageCapture?: (imageBase64: string) => void;
}

export interface CameraViewRef {
  clearCapturedImage: () => void;
}

const CameraView = forwardRef<CameraViewRef, CameraViewProps>(({ onImageCapture }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    clearCapturedImage: () => {
      setCapturedImage(null);
    }
  }));

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageBase64 = canvas.toDataURL('image/png');
        setCapturedImage(imageBase64);
        onImageCapture?.(imageBase64);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {capturedImage ? (
        <img 
          src={capturedImage} 
          alt="Captured" 
          className="w-full h-full object-contain"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      )}
      
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {!capturedImage && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={captureImage}
            className="w-16 h-16 bg-red-500 rounded-full border-4 border-white shadow-lg hover:bg-red-600 transition-colors"
          />
        </div>
      )}
    </div>
  );
});

CameraView.displayName = 'CameraView';

export default CameraView;