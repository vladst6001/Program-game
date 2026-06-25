import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useEditorStore, EditorObject } from '../../store/editorStore';

function SceneObject({ obj }: { obj: EditorObject }) {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const isSelected = selectedId === obj.id;

  if (!obj.visible) return null;

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectObject(obj.id);
  };

  const geo = (() => {
    switch (obj.type) {
      case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'plane': return <planeGeometry args={[1, 1]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  })();

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

function Gizmo() {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  if (!selectedId) return null;
  return (
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
      <GizmoViewport />
    </GizmoHelper>
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
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#0066ff" />

      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#252532"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#353548"
        fadeDistance={25}
        infiniteGrid
      />

      {objects.map((obj) => (
        <SceneObject key={obj.id} obj={obj} />
      ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      <Gizmo />
    </Canvas>
  );
}
