import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { gamesApi } from '../../api/games';
import { useAuthStore } from '../../store/authStore';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface GameObject {
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}

function PlayObject({ obj }: { obj: GameObject }) {
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
      <mesh>
        {geo}
        <meshStandardMaterial color={obj.color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState('');
  const autoRegister = useAuthStore((s) => s.autoRegister);

  useEffect(() => {
    const load = async () => {
      if (!useAuthStore.getState().token) await autoRegister();
      try {
        const { data } = await gamesApi.get(id!);
        setGame(data);
      } catch {
        setError('Игра не найдена');
      }
    };
    load();
  }, [id]);

  if (error) return <div className="h-screen flex items-center justify-center bg-dark-900 text-red-400">{error}</div>;
  if (!game) return <div className="h-screen flex items-center justify-center bg-dark-900 text-neon-green animate-pulse">Загрузка...</div>;

  const code = game.code as any;
  const scene = code?.scene || code?.objects || [];

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <div className="h-10 bg-dark-800 border-b border-dark-500 flex items-center px-4 shrink-0">
        <span className="text-sm font-bold text-neon-green">🎮 {game.name}</span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-500">Play Mode</span>
      </div>
      <div className="flex-1">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }} gl={{ antialias: true }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <Grid args={[20, 20]} cellSize={1} cellColor="#252532" sectionSize={5} sectionColor="#353548" infiniteGrid />
          {Array.isArray(scene) && scene.map((obj: GameObject, i: number) => (
            <PlayObject key={i} obj={obj} />
          ))}
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
