import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { gamesApi } from '../../api/games';
import { useAuthStore } from '../../store/authStore';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

interface GameObject {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  isStatic?: boolean;
  hp?: number;
  speed?: number;
  tag?: string;
  isPlayer?: boolean;
}

const GRAVITY = -20;
const PLAYER_SIZE = 0.6;

function getGeometry(type: string) {
  switch (type) {
    case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
    case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    case 'plane': return <planeGeometry args={[1, 1]} />;
    case 'floor': return <boxGeometry args={[4, 0.1, 4]} />;
    case 'wall': return <boxGeometry args={[4, 3, 0.2]} />;
    case 'stair': return <boxGeometry args={[1, 2, 2]} />;
    default: return <boxGeometry args={[1, 1, 1]} />;
  }
}

function GamePlayer({
  keys,
  objects,
  onCollision,
  playerObj,
  paused,
}: {
  keys: React.MutableRefObject<Set<string>>;
  objects: GameObject[];
  onCollision: (obj: GameObject) => void;
  playerObj: GameObject;
  paused: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const { camera } = useThree();
  const groundedRef = useRef(true);
  const speed = playerObj.speed || 8;

  useFrame((_, delta) => {
    if (paused || !meshRef.current) return;
    const dt = Math.min(delta, 0.05);
    const vel = velocityRef.current;
    const mesh = meshRef.current;
    const ck = keys.current;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (ck.has('w') || ck.has('arrowup')) moveDir.add(forward);
    if (ck.has('s') || ck.has('arrowdown')) moveDir.sub(forward);
    if (ck.has('d') || ck.has('arrowright')) moveDir.add(right);
    if (ck.has('a') || ck.has('arrowleft')) moveDir.sub(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();
      vel.x = moveDir.x * speed;
      vel.z = moveDir.z * speed;
    } else {
      vel.x *= 0.85;
      vel.z *= 0.85;
    }

    if ((ck.has(' ') || ck.has('space')) && groundedRef.current) {
      vel.y = 10;
      groundedRef.current = false;
    }

    vel.y += GRAVITY * dt;
    mesh.position.x += vel.x * dt;
    mesh.position.y += vel.y * dt;
    mesh.position.z += vel.z * dt;

    if (mesh.position.y <= PLAYER_SIZE / 2) {
      mesh.position.y = PLAYER_SIZE / 2;
      vel.y = 0;
      groundedRef.current = true;
    }

    const cameraOffset = new THREE.Vector3(0, 4, 8);
    const targetPos = mesh.position.clone().add(cameraOffset);
    camera.position.lerp(targetPos, 0.08);
    const lookTarget = mesh.position.clone();
    lookTarget.y += 0.5;
    camera.lookAt(lookTarget);

    const playerBox = new THREE.Box3().setFromObject(mesh);
    for (const obj of objects) {
      if (obj.isPlayer || obj.tag === playerObj.tag) continue;
      const objPos = new THREE.Vector3(...obj.position);
      const objScale = new THREE.Vector3(...obj.scale);
      const objBox = new THREE.Box3(
        objPos.clone().sub(objScale.clone().multiplyScalar(0.5)),
        objPos.clone().add(objScale.clone().multiplyScalar(0.5))
      );
      if (playerBox.intersectsBox(objBox)) {
        onCollision(obj);
      }
    }
  });

  const startPos = playerObj.position || [0, 1, 0];

  return (
    <mesh ref={meshRef} position={[startPos[0], startPos[1] + PLAYER_SIZE / 2, startPos[2]]} castShadow>
      <boxGeometry args={[PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE]} />
      <meshStandardMaterial color={playerObj.color || '#39ff14'} emissive={playerObj.color || '#39ff14'} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

function SceneObjects({ objects, paused }: { objects: GameObject[]; paused: boolean }) {
  return (
    <>
      {objects.map((obj) => {
        if (obj.isPlayer) return null;
        return (
          <mesh key={obj.id} position={obj.position} rotation={obj.rotation} scale={obj.scale} castShadow receiveShadow>
            {getGeometry(obj.type)}
            <meshStandardMaterial color={obj.color} metalness={0.3} roughness={0.6} />
          </mesh>
        );
      })}
    </>
  );
}

function HUD({ hp, score, gameName, paused, onTogglePause, onBack }: {
  hp: number; score: number; gameName: string; paused: boolean;
  onTogglePause: () => void; onBack: () => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <button onClick={onBack} className="pointer-events-auto px-3 py-1.5 bg-dark-800 border border-dark-500 rounded text-xs text-gray-300 hover:text-neon-green hover:border-neon-green/40 transition-colors">
          ← Выход
        </button>
        <span className="text-sm font-bold text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]">{gameName}</span>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-[10px] text-red-400 font-bold">HP</span>
        <div className="w-32 h-3 bg-dark-800 rounded-full border border-dark-500 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{
            width: `${Math.max(0, hp)}%`,
            background: hp > 50 ? 'linear-gradient(90deg, #39ff14, #00f0ff)' : hp > 25 ? 'linear-gradient(90deg, #ffaa00, #ff6600)' : 'linear-gradient(90deg, #ff3366, #ff0000)',
          }} />
        </div>
        <span className="text-xs font-mono text-white">{hp}</span>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <span className="text-lg font-bold text-neon-blue drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">★ {score}</span>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2">
        <button onClick={onTogglePause} className="pointer-events-auto px-3 py-1.5 bg-dark-800 border border-dark-500 rounded text-xs text-gray-300 hover:text-neon-green hover:border-neon-green/40 transition-colors">
          {paused ? '▶ Продолжить' : '⏸ Пауза'}
        </button>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-dark-500">
        WASD — движение · Пробел — прыжок · Клик — захват
      </div>

      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <span className="text-2xl font-bold text-neon-green animate-pulse">⏸ ПАУЗА</span>
        </div>
      )}
    </div>
  );
}

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState('');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [collisionMessage, setCollisionMessage] = useState<string | null>(null);
  const autoRegister = useAuthStore((s) => s.autoRegister);
  const keysRef = useRef(new Set<string>());
  const lastCollisionRef = useRef('');

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

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'Escape') setPaused((p) => !p);
    };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  if (error) return <div className="h-screen flex items-center justify-center bg-dark-900"><div className="text-center"><p className="text-red-400 text-lg mb-4">{error}</p><button onClick={() => navigate('/')} className="btn-neon">← Назад в галерею</button></div></div>;
  if (!game) return <div className="h-screen flex items-center justify-center bg-dark-900 text-neon-green animate-pulse">Загрузка...</div>;

  const code = game.code as any;
  const scene = (code?.scene || code?.objects || []) as GameObject[];
  const objects = scene.map((o, i) => ({ ...o, id: o.id || `obj_${i}`, isStatic: o.isStatic ?? true, hp: o.hp ?? 100, speed: o.speed ?? 5, tag: o.tag ?? '', isPlayer: o.isPlayer ?? false }));

  const playerObj = objects.find((o) => o.isPlayer) || objects[0] || { id: 'player', name: 'Player', type: 'cube', position: [0, 1, 0], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number], color: '#39ff14', isPlayer: true, speed: 8 };

  const handleCollision = (obj: GameObject) => {
    const now = Date.now();
    if (now - (lastCollisionRef as any).current < 500) return;
    (lastCollisionRef as any).current = now;
    setScore((s) => s + 10);
    setCollisionMessage(`Столкновение: ${obj.name}!`);
    setTimeout(() => setCollisionMessage(null), 1500);
  };

  return (
    <div className="h-screen relative bg-dark-900 overflow-hidden">
      <HUD hp={hp} score={score} gameName={game.name} paused={paused} onTogglePause={() => setPaused(!paused)} onBack={() => navigate('/')} />
      {collisionMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-neon-green/20 border border-neon-green/40 rounded-lg">
          <span className="text-sm font-bold text-neon-green">{collisionMessage}</span>
        </div>
      )}
      <Canvas camera={{ position: [0, 4, 8], fov: 60 }} gl={{ antialias: true }} shadows style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 5]} intensity={0.8} castShadow />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#00f0ff" />
        <Grid args={[40, 40]} cellSize={1} cellColor="#1a1a25" sectionSize={5} sectionColor="#252532" infiniteGrid position={[0, -0.01, 0]} />
        <SceneObjects objects={objects} paused={paused} />
        <GamePlayer keys={keysRef} objects={objects} onCollision={handleCollision} playerObj={playerObj} paused={paused} />
      </Canvas>
    </div>
  );
}
