import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore, EditorObject } from '../../store/editorStore';

function SceneObject({ obj }: { obj: EditorObject }) {
  const selectedId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
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
      case 'camera': return <boxGeometry args={[0.5, 0.5, 0.8]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  })();

  const rotRad = obj.rotation.map((r) => r * Math.PI / 180) as [number, number, number];

  return (
    <group position={obj.position} rotation={rotRad} scale={obj.scale}>
      <mesh onClick={(e) => { e.stopPropagation(); selectObject(obj.id); }} castShadow receiveShadow>
        {geo}
        <meshStandardMaterial
          color={obj.type === 'camera' ? '#ffaa00' : obj.color}
          emissive={isSelected ? (obj.type === 'camera' ? '#ffaa00' : obj.color) : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          wireframe={obj.type === 'plane'}
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      {isSelected && (
        <>
          <mesh scale={[1.03, 1.03, 1.03]}>
            {geo}
            <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.5} />
          </mesh>
          <mesh position={[1, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
          <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
            <meshBasicMaterial color="#44ff44" />
          </mesh>
          <mesh position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
            <meshBasicMaterial color="#4444ff" />
          </mesh>
        </>
      )}
      {obj.type === 'camera' && (
        <mesh position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

function EditorCamera() {
  const { camera } = useThree();
  const keysRef = useRef(new Set<string>());

  useEffect(() => {
    const kd = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useFrame((_, delta) => {
    const keys = keysRef.current;
    const speed = keys.has('shift') ? 20 : 5;
    const dt = Math.min(delta, 0.1);

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.has('arrowup') || keys.has('w')) camera.position.addScaledVector(forward, speed * dt);
    if (keys.has('arrowdown') || keys.has('s')) camera.position.addScaledVector(forward, -speed * dt);
    if (keys.has('arrowleft') || keys.has('a')) camera.position.addScaledVector(right, -speed * dt);
    if (keys.has('arrowright') || keys.has('d')) camera.position.addScaledVector(right, speed * dt);
    if (keys.has(' ')) camera.position.y += speed * dt;
    if (keys.has('shift')) camera.position.y -= speed * dt;
  });

  return null;
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

      <Grid args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#252532" sectionSize={5} sectionThickness={1} sectionColor="#353548" fadeDistance={25} infiniteGrid />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.8} />
      </mesh>

      {objects.map((obj) => <SceneObject key={obj.id} obj={obj} />)}

      <EditorCamera />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1}  />
    </Canvas>
  );
}
