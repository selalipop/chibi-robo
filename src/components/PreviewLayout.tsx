import { motion } from "framer-motion";
import MeshViewer from "./MeshViewer";

interface PreviewLayoutProps {
  compositeImage: string;
  meshes: { mesh: string; id: number }[];
}

export default function PreviewLayout({ compositeImage, meshes }: PreviewLayoutProps) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center p-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ height: "80vh", width: "80vw", margin: "10vh 10vw" }}
    >
      {/* Composite Image - Center View */}
      <motion.div
        className="flex-1 flex items-center justify-center mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <img
          src={compositeImage}
          alt="Composite Result"
          className="max-w-full max-h-full object-contain rounded-2xl border-4 border-blue-100 shadow-2xl"
        />
      </motion.div>

      {/* Meshes Row - Bottom */}
      <motion.div
        className="flex gap-4 justify-center items-center"
        style={{ height: "30%" }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {meshes.map((meshData, index) => (
          <motion.div
            key={meshData.id}
            className="h-full aspect-square"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.6 + index * 0.1,
              type: "spring",
              stiffness: 100,
            }}
          >
            <MeshViewer
              glbUrl={meshData.mesh}
              className="w-full h-full border-2 border-gray-200 rounded-xl"
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}