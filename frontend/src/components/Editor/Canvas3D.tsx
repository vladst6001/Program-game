import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useEffect, useState } from 'react';
import { useEditorStore, EditorObject } from '../../store/editorStore';
import { TransformControls as DreiTransformControls } from '@react-three/drei';

function SelectableObject({ obj }: { obj: EditorObject }) {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const updateObject = useEditorStore((s) => s.updateObject);
  const toolMode = useEditorStore((s) => (s as any).toolMode || 'translate');
  const isSelected = selectedId === obj.id;
  const meshRef = useRef<THREE.Mesh>(null);
  const transformRef = useRef<any>(null);

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
      case 'floor': return <boxGeometry args={[4, 0.1, 4]} />;
      case 'wall': return <boxGeometry args={[4, 3, 0.2]} />;
      case 'stair': return <boxGeometry args={[1, 2, 2]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  })();

  const group = (
    <group position={obj.position} rotation={obj.rotation} scale={obj.scale}>
      <mesh ref={meshRef} onClick={handleClick} castShadow receiveShadow>
        {geo}
        <meshStandardMaterial
          color={obj.color}
          emissive={isSelected ? obj.color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          wireframe={obj.type === 'plane'}
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      {isSelected && (
        <mesh scale={[1.03, 1.03, 1.03]}>
          {geo}
          <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );

  if (!isSelected) return group;

  const mode = toolMode === 'rotate' ? 'rotate' : toolMode === 'scale' ? 'scale' : 'translate';

  return (
    <DreiTransformControls
      object={meshRef as any}
      mode={mode as any}
      size={0.7}
      onObjectChange={() => {
        if (!meshRef.current) return;
        const pos = meshRef.current.position;
        const rot = meshRef.current.rotation;
        const scl = meshRef.current.scale;
        updateObject(obj.id, {
          position: [pos.x, pos.y, pos.z],
          rotation: [rot.x * 180 / Math.PI, rot.y * 180 / Math.PI, rot.z * 180 / Math.PI],
          scale: [scl.x, scl.y, scl.z],
        });
      }}
    >
      {group}
    </DreiTransformControls>
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
      shadows
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 5]} intensity={0.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
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

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.8} />
      </mesh>

      {objects.map((obj) => (
        <SelectableObject key={obj.id} obj={obj} />
      ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
    </Canvas>
  );
}
