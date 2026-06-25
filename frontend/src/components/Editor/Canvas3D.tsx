import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore, EditorObject } from '../../store/editorStore';
import { TransformControls as DreiTransformControls } from '@react-three/drei';

function SceneObject({ obj, onSelect }: { obj: EditorObject; onSelect: (id: string) => void }) {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const isSelected = selectedId === obj.id;

  if (!obj.visible) return null;

  const geo = (() => {
    switch (obj.type) {
      case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'plane': return <planeGeometry args={[1, 1]} />;
      case 'floor': return <boxGeometry args={[4, 0.1, 4]} />;
      case 'wall': return <boxGeometry args={[4, 3, 0.2]} />;
      case 'stair': return <boxGeometry args={[2, 1.5, 2]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  })();

  return (
    <group position={obj.position} rotation={obj.rotation} scale={obj.scale}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
        castShadow
        receiveShadow
      >
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
      {/* X/Y/Z Labels when selected */}
      {isSelected && (
        <group>
          {/* X axis label */}
          <group position={[1.5, 0, 0]}>
            <mesh><boxGeometry args={[0.3, 0.15, 0.02]} /><meshBasicMaterial color="#ff4444" /></mesh>
          </group>
          {/* Y axis label */}
          <group position={[0, 1.5, 0]}>
            <mesh><boxGeometry args={[0.15, 0.3, 0.02]} /><meshBasicMaterial color="#44ff44" /></mesh>
          </group>
          {/* Z axis label */}
          <group position={[0, 0, 1.5]}>
            <mesh><boxGeometry args={[0.15, 0.02, 0.3]} /><meshBasicMaterial color="#4444ff" /></mesh>
          </group>
        </group>
      )}
    </group>
  );
}

function TransformGizmo({ orbitRef }: { orbitRef: React.RefObject<any> }) {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const objects = useEditorStore((s) => s.objects);
  const updateObject = useEditorStore((s) => s.updateObject);
  const toolMode = useEditorStore((s) => s.toolMode);
  const transformRef = useRef<any>(null);

  const selected = objects.find((o) => o.id === selectedId);
  if (!selected) return null;

  const mode = toolMode === 'rotate' ? 'rotate' : toolMode === 'scale' ? 'scale' : 'translate';

  const handleChange = useCallback(() => {
    if (!transformRef.current) return;
    const obj = transformRef.current.object;
    if (!obj) return;

    updateObject(selected.id, {
      position: [
        Math.round(obj.position.x * 100) / 100,
        Math.round(obj.position.y * 100) / 100,
        Math.round(obj.position.z * 100) / 100,
      ],
      rotation: [
        Math.round(obj.rotation.x * 180 / Math.PI * 10) / 10,
        Math.round(obj.rotation.y * 180 / Math.PI * 10) / 10,
        Math.round(obj.rotation.z * 180 / Math.PI * 10) / 10,
      ],
      scale: [
        Math.round(obj.scale.x * 100) / 100,
        Math.round(obj.scale.y * 100) / 100,
        Math.round(obj.scale.z * 100) / 100,
      ],
    });
  }, [selected.id, updateObject]);

  return (
    <DreiTransformControls
      ref={transformRef}
      object={new THREE.Object3D().translateX(selected.position[0]).translateY(selected.position[1]).translateZ(selected.position[2])}
      mode={mode as any}
      size={1.5}
      onPointerDown={() => {
        if (orbitRef.current) orbitRef.current.enabled = false;
      }}
      onPointerUp={() => {
        if (orbitRef.current) orbitRef.current.enabled = true;
      }}
      onObjectChange={handleChange}
    />
  );
}

function OrbitControlsWrapper({ orbitRef }: { orbitRef: React.RefObject<any> }) {
  return <OrbitControls ref={orbitRef} makeDefault enableDamping dampingFactor={0.1} />;
}

export default function Canvas3D() {
  const objects = useEditorStore((s) => s.objects);
  const selectObject = useEditorStore((s) => s.selectObject);
  const orbitRef = useRef<any>(null);

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
        <SceneObject key={obj.id} obj={obj} onSelect={(id) => selectObject(id)} />
      ))}

      <TransformGizmo orbitRef={orbitRef} />
      <OrbitControlsWrapper orbitRef={orbitRef} />
    </Canvas>
  );
}
