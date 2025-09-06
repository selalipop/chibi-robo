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

function Placeholder() {
  return (
    <motion.div
      className="h-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center animate-pulse"
      animate={{
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{
        opacity: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    ></motion.div>
  );
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
          if (event.event === "prompts_generated") {
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
              transition: { duration: 0.6, ease: "easeInOut" },
            }}
          >
            <CameraView
              ref={cameraViewRef}
              onImageCapture={handleImageCapture}
            />
          </motion.div>
        )}
        {wizardState === WizardState.GeneratingSceneImages && (
          <motion.div
            key="scene-images"
            className="fixed inset-0 flex items-center justify-center-safe px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex h-[50vh] w-full justify-center items-center gap-4 bg-red-200">
              {prompts.map((_, index) => {
                const image = sceneImages[index];
                return (
                  <div
                    key={index}
                    className="flex-1 aspect-square h-full relative items-center justify-center flex"
                  >
                    {/* Pulsating placeholder */}
                    {!image && <Placeholder />}

                    {/* Actual image */}
                    <AnimatePresence>
                      {image && (
                        <motion.div
                          key={image}
                          className=" inset-0 aspect-square h-full animate-[wiggle_1s_ease-in-out_infinite] rounded-3xl"
                          initial={{
                            opacity: 0,
                            scale: 0.3,
                            y: 100,
                            rotate: -15,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            rotate: 0,
                          }}
                          transition={{
                            duration: 0.6,
                            delay: 0.1,
                            ease: "easeOut",
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                          }}
                        >
                          <img
                            src={image}
                            alt={`Scene Image ${index + 1}`}
                            className="aspect-square h-full object-contain border-8 border-blue-50 rounded-3xl"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
