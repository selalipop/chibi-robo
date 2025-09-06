import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "../utils/trpc";
import CameraView, { CameraViewRef } from "./CameraView";

// Hackathon friendly architecture
enum WizardState {
  Splash,
  Capture,
  GeneratingSuggestions,
  SelectSuggestion,
  GeneratingSceneImages,
}

export default function Home() {
  const suggestions = trpc.getImageSuggestions.useMutation();
  const generateSceneImages = trpc.getSceneImages.useMutation();
  const cameraViewRef = useRef<CameraViewRef>(null);
  const [wizardState, setWizardState] = useState<WizardState>(
    WizardState.Capture
  );
  const [prompts, setPrompts] = useState<string[]>([]);
  const [sceneImages, setSceneImages] = useState<string[]>([]);
  const handleImageCapture = (imageBase64: string) => {
    // suggestions.mutate({ imageBase64: imageBase64, numSuggestions: 3 });
    setWizardState(WizardState.GeneratingSceneImages);
    generateSceneImages
      .mutateAsync({ imageBase64: imageBase64, sceneDescription: "" })
      .then(async (data) => {
        for await (const event of data) {
          console.log("event", event);
          if (event.event === "created_image") {
            setSceneImages((prev) => [...prev, event.data]);
          }
          if( event.event === "prompts_generated") {
            setPrompts(event.data);
          }
        }
      });
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-w-screen">
      <AnimatePresence mode="wait">
        {wizardState === WizardState.Capture && (
          <motion.div
            key="camera"
            initial={{ scale: 1, opacity: 1 }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              x: -1000,
              transition: { duration: 0.6, ease: "easeInOut" }
            }}
          >
            <CameraView ref={cameraViewRef} onImageCapture={handleImageCapture} />
          </motion.div>
        )}
        {wizardState === WizardState.GeneratingSceneImages && (
          <motion.div 
            key="scene-images"
            className="fixed inset-0 flex items-center justify-start pl-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="relative h-[50vh] bg-green-300 w-full">
              <AnimatePresence>
                {sceneImages.map((image, index) => (
                  <motion.img 
                    key={image} 
                    src={image} 
                    alt="Scene Image" 
                    className="absolute h-full w-auto object-contain bg-red-200" 
                    style={{
                      top: `0`,
                      left: `${index * 200}px`,
                      zIndex: index
                    }}
                    initial={{ 
                      opacity: 0, 
                      scale: 0.3,
                      y: 100,
                      rotate: -15
                    }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      y: 0,
                      rotate: 0
                    }}
                    transition={{ 
                      duration: 0.6,
                      delay: index * 0.2,
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
