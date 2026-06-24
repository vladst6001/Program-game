import { useGLTF } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface ModelLoaderProps {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isSelected: boolean;
  onClick: (e: any) => void;
}

function GLBModel({ url, isSelected, onClick }: { url: string; isSelected: boolean; onClick: (e: any) => void }) {
  const { scene } = useGLTF(url);
  const ref = useRef<any>(null);

  useFrame(() => {
    if (ref.current && isSelected) {
      ref.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.emissiveIntensity = 0.3;
        }
      });
    }
  });

  return (
    <primitive
      ref={ref}
      object={scene.clone()}
      onClick={onClick}
    />
  );
}

function OBJFallback({ url }: { url: string }) {
  const groupRef = useRef<any>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#39ff14" wireframe />
      </mesh>
    </group>
  );
}

export default function ModelLoader({
  url,
  position,
  rotation,
  scale,
  isSelected,
  onClick,
}: ModelLoaderProps) {
  const ext = url.split('.').pop()?.toLowerCase();

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {ext === 'obj' ? (
        <OBJFallback url={url} />
      ) : (
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#353548" wireframe />
          </mesh>
        }>
          <GLBModel url={url} isSelected={isSelected} onClick={onClick} />
        </Suspense>
      )}

      {isSelected && (
        <mesh scale={[1.05, 1.05, 1.05]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload('');
