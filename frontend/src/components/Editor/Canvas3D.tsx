import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore, EditorObject } from '../../store/editorStore';
import ModelLoader from './ModelLoader';

function SceneObject({ obj }: { obj: EditorObject }) {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const updateObject = useEditorStore((s) => s.updateObject);
  const isSelected = selectedId === obj.id;

  if (!obj.visible) return null;

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectObject(obj.id);
  };

  const geo = (() => {
    switch (obj.type) {
      case 'cube':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'plane':
        return <planeGeometry args={[1, 1]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  })();

  if (obj.type === 'gltf' || obj.type === 'obj') {
    return (
      <ModelLoader
        url={obj.modelUrl!}
        position={obj.position}
        rotation={obj.rotation}
        scale={obj.scale}
        isSelected={isSelected}
        onClick={handleClick}
      />
    );
  }

  return (
    <group position={obj.position} rotation={obj.rotation} scale={obj.scale}>
      <mesh onClick={handleClick}>
        {geo}
        <meshStandardMaterial
          color={obj.color}
          emissive={isSelected ? obj.color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          wireframe={obj.type === 'plane'}
          side={THREE.DoubleSide}
        />
      </mesh>
      {isSelected && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          {geo}
          <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

export default function Canvas3D() {
  const objects = useEditorStore((s) => s.objects);
  const selectObject = useEditorStore((s) => s.selectObject);

  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ antialias: true }}
      onPointerMissed={() => selectObject(null)}
      className="bg-dark-900"
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#00f0ff" />

      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#252532"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#353548"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
      />

      {objects.map((obj) => (
        <SceneObject key={obj.id} obj={obj} />
      ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport />
      </GizmoHelper>

      <Environment preset="city" />
    </Canvas>
  );
}
