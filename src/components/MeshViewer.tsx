import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center, Bounds, useBounds } from '@react-three/drei';
import { Group, Box3, Vector3 } from 'three';

interface MeshProps {
  url: string;
}

function Mesh({ url }: MeshProps) {
  const meshRef = useRef<Group>(null);
  const { scene } = useGLTF(url);
  const { camera, size } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (scene && meshRef.current) {
      // Ensure materials have proper properties for visibility
      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.material) {
            // Ensure material is visible and has proper settings
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.needsUpdate = true;
            
            // Add basic color if no texture
            if (!child.material.map && !child.material.color) {
              child.material.color.setHex(0x888888);
            }
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Auto-scale to fit the viewport more aggressively
      const box = new Box3().setFromObject(scene);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim; // Scale to fit in a 3-unit space (larger)
      
      meshRef.current.scale.setScalar(scale);
      meshRef.current.position.copy(center).multiplyScalar(-scale);
    }
  }, [scene]);

  return (
    <group ref={meshRef}>
      <primitive object={scene.clone()} />
    </group>
  );
}

function BoundsContent({ url }: { url: string }) {
  const bounds = useBounds();

  useEffect(() => {
    const timeout = setInterval(() => {
      bounds.refresh()
    }, 100);

    return () => clearTimeout(timeout);
  }, [bounds]);

  return (
    <Center>
      <Mesh url={url} />
    </Center>
  );
}

interface MeshViewerProps {
  glbUrl: string;
  className?: string;
}

export default function MeshViewer({ glbUrl, className = "" }: MeshViewerProps) {
  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '200px' }}>
      <Canvas
        camera={{ 
          position: [2, 1.5, 2], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        shadows
      >
        {/* Bright lighting setup */}
        <ambientLight intensity={20} color="#ffffff" />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={2.0} 
          color="#ffffff"
        />
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={1.5} 
          color="#ffffff"
        />
        <directionalLight 
          position={[0, -5, 0]} 
          intensity={1.0} 
          color="#ffffff"
        />
        <pointLight position={[3, 3, 3]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-3, -3, -3]} intensity={1.2} color="#ffffff" />
        <pointLight position={[0, 0, 5]} intensity={1.0} color="#ffffff" />
        
        {/* Use Bounds for automatic fitting */}
        <Bounds fit clip observe margin={1.2}>
          <BoundsContent url={glbUrl} />
        </Bounds>
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
          maxDistance={6}
          minDistance={0.5}
        />
      </Canvas>
    </div>
  );
}