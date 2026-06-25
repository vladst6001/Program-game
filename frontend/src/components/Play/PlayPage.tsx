import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { gamesApi } from '../../api/games';
import { useAuthStore } from '../../store/authStore';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { PointerLockControls } from '@react-three/drei';

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
}

interface PhysicsBody {
  id: string;
  velocity: THREE.Vector3;
  grounded: boolean;
}

const GRAVITY = -20;
const PLAYER_SPEED = 8;
const PLAYER_SIZE = 0.5;
const JUMP_FORCE = 10;
const FLOOR_Y = 0;

function getGeometry(type: string) {
  switch (type) {
    case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
    case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    case 'plane': return <planeGeometry args={[1, 1]} />;
    default: return <boxGeometry args={[1, 1, 1]} />;
  }
}

function GamePlayer({
  keys,
  objects,
  onCollision,
  playerHp,
  setPlayerHp,
  paused,
}: {
  keys: React.MutableRefObject<Set<string>>;
  objects: GameObject[];
  onCollision: (obj: GameObject) => void;
  playerHp: number;
  setPlayerHp: (v: number | ((h: number) => number)) => void;
  paused: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const { camera } = useThree();
  const groundedRef = useRef(true);
  const prevKeysRef = useRef(new Set<string>());

  useFrame((_, delta) => {
    if (paused || !meshRef.current) return;

    const dt = Math.min(delta, 0.05);
    const vel = velocityRef.current;
    const mesh = meshRef.current;
    const currentKeys = keys.current;

    // Movement direction relative to camera
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (currentKeys.has('w') || currentKeys.has('arrowup')) moveDir.add(forward);
    if (currentKeys.has('s') || currentKeys.has('arrowdown')) moveDir.sub(forward);
    if (currentKeys.has('d') || currentKeys.has('arrowright')) moveDir.add(right);
    if (currentKeys.has('a') || currentKeys.has('arrowleft')) moveDir.sub(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();
      vel.x = moveDir.x * PLAYER_SPEED;
      vel.z = moveDir.z * PLAYER_SPEED;
    } else {
      vel.x *= 0.85;
      vel.z *= 0.85;
    }

    // Jump
    if ((currentKeys.has(' ') || currentKeys.has('space')) && groundedRef.current) {
      vel.y = JUMP_FORCE;
      groundedRef.current = false;
    }

    // Gravity
    vel.y += GRAVITY * dt;

    // Apply velocity
    mesh.position.x += vel.x * dt;
    mesh.position.y += vel.y * dt;
    mesh.position.z += vel.z * dt;

    // Floor collision
    if (mesh.position.y <= FLOOR_Y + PLAYER_SIZE / 2) {
      mesh.position.y = FLOOR_Y + PLAYER_SIZE / 2;
      vel.y = 0;
      groundedRef.current = true;
    }

    // Camera follow
    const cameraOffset = new THREE.Vector3(0, 4, 8);
    const targetPos = mesh.position.clone().add(cameraOffset);
    camera.position.lerp(targetPos, 0.08);
    const lookTarget = mesh.position.clone();
    lookTarget.y += 0.5;
    camera.lookAt(lookTarget);

    // Collision check with objects
    const playerBox = new THREE.Box3().setFromObject(mesh);
    for (const obj of objects) {
      if (obj.tag === 'player') continue;
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

    prevKeysRef.current = new Set(currentKeys);
  });

  return (
    <mesh ref={meshRef} position={[0, PLAYER_SIZE / 2 + 0.01, 0]} castShadow>
      <boxGeometry args={[PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE]} />
      <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

function PhysicsObjects({
  objects,
  paused,
  physicsBodies,
}: {
  objects: GameObject[];
  paused: boolean;
  physicsBodies: React.MutableRefObject<Map<string, PhysicsBody>>;
}) {
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  useFrame((_, delta) => {
    if (paused) return;
    const dt = Math.min(delta, 0.05);
    const bodies = physicsBodies.current;

    for (const obj of objects) {
      if (obj.isStatic || obj.tag === 'player') continue;

      let body = bodies.get(obj.id);
      if (!body) {
        body = { id: obj.id, velocity: new THREE.Vector3(0, 0, 0), grounded: false };
        bodies.set(obj.id, body);
      }

      body.velocity.y += GRAVITY * dt;

      const mesh = meshRefs.current.get(obj.id);
      if (!mesh) continue;

      mesh.position.y += body.velocity.y * dt;

      // Floor
      const halfHeight = (obj.scale?.[1] || 1) * 0.5;
      if (mesh.position.y <= FLOOR_Y + halfHeight) {
        mesh.position.y = FLOOR_Y + halfHeight;
        body.velocity.y = 0;
        body.grounded = true;
      }
    }
  });

  return (
    <>
      {objects.map((obj) => {
        if (obj.tag === 'player') return null;
        return (
          <mesh
            key={obj.id}
            ref={(el) => { if (el) meshRefs.current.set(obj.id, el); }}
            position={obj.position}
            rotation={obj.rotation ? [obj.rotation[0] * Math.PI / 180, obj.rotation[1] * Math.PI / 180, obj.rotation[2] * Math.PI / 180] : undefined}
            scale={obj.scale}
            castShadow
            receiveShadow
          >
            {getGeometry(obj.type)}
            <meshStandardMaterial
              color={obj.color}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
        );
      })}
    </>
  );
}

function HUD({
  hp,
  score,
  gameName,
  paused,
  onTogglePause,
}: {
  hp: number;
  score: number;
  gameName: string;
  paused: boolean;
  onTogglePause: () => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Game name */}
      <div className="absolute top-4 left-4">
        <span className="text-sm font-bold text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]">
          {gameName}
        </span>
      </div>

      {/* HP Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-[10px] text-red-400 font-bold">HP</span>
        <div className="w-32 h-3 bg-dark-800 rounded-full border border-dark-500 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(0, hp)}%`,
              background: hp > 50
                ? 'linear-gradient(90deg, #39ff14, #00f0ff)'
                : hp > 25
                ? 'linear-gradient(90deg, #ffaa00, #ff6600)'
                : 'linear-gradient(90deg, #ff3366, #ff0000)',
            }}
          />
        </div>
        <span className="text-xs font-mono text-white">{hp}</span>
      </div>

      {/* Score */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <span className="text-lg font-bold text-neon-blue drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
          ★ {score}
        </span>
      </div>

      {/* Pause button */}
      <button
        onClick={onTogglePause}
        className="absolute bottom-4 right-4 pointer-events-auto px-3 py-1.5 bg-dark-800 border border-dark-500 rounded text-xs text-gray-300 hover:text-neon-green hover:border-neon-green/40 transition-colors"
      >
        {paused ? '▶ Продолжить' : '⏸ Пауза'}
      </button>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-[10px] text-dark-500">
        WASD / Стрелки — движение · Пробел — прыжок · Клик — захват курсора
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <span className="text-2xl font-bold text-neon-green animate-pulse">⏸ ПАУЗА</span>
        </div>
      )}
    </div>
  );
}

function GameScene({
  objects,
  keys,
  paused,
  setPaused,
  hp,
  setHp,
  score,
  setScore,
  gameName,
  setCollisionMessage,
}: {
  objects: GameObject[];
  keys: React.MutableRefObject<Set<string>>;
  paused: boolean;
  setPaused: (v: boolean | ((p: boolean) => boolean)) => void;
  hp: number;
  setHp: (v: number | ((h: number) => number)) => void;
  score: number;
  setScore: (v: number | ((s: number) => number)) => void;
  gameName: string;
  setCollisionMessage: (msg: string | null) => void;
}) {
  const physicsBodies = useRef(new Map<string, PhysicsBody>());
  const lastCollisionRef = useRef<string>('');
  const collisionCooldown = useRef(0);

  const handleCollision = useCallback((obj: GameObject) => {
    const now = Date.now();
    if (now - collisionCooldown.current < 500) return;
    if (lastCollisionRef.current === obj.id) return;

    lastCollisionRef.current = obj.id;
    collisionCooldown.current = now;

    setScore((s) => s + 10);
    setCollisionMessage(`Столкновение: ${obj.name}!`);
    setTimeout(() => setCollisionMessage(null), 1500);

    setTimeout(() => {
      lastCollisionRef.current = '';
    }, 500);
  }, [setScore, setCollisionMessage]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 5]} intensity={0.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00f0ff" />

      <Grid args={[40, 40]} cellSize={1} cellColor="#1a1a25" sectionSize={5} sectionColor="#252532" infiniteGrid position={[0, -0.01, 0]} />

      <PhysicsObjects objects={objects} paused={paused} physicsBodies={physicsBodies} />

      <GamePlayer
        keys={keys}
        objects={objects}
        onCollision={handleCollision}
        playerHp={hp}
        setPlayerHp={setHp}
        paused={paused}
      />

      <PointerLockControls />
    </>
  );
}

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState('');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [collisionMessage, setCollisionMessage] = useState<string | null>(null);
  const autoRegister = useAuthStore((s) => s.autoRegister);
  const keysRef = useRef(new Set<string>());

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
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'Escape') {
        setPaused((p) => !p);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (error) return <div className="h-screen flex items-center justify-center bg-dark-900 text-red-400">{error}</div>;
  if (!game) return <div className="h-screen flex items-center justify-center bg-dark-900 text-neon-green animate-pulse">Загрузка...</div>;

  const code = game.code as any;
  const scene = (code?.scene || code?.objects || []) as GameObject[];

  const objects = scene.map((o, i) => ({
    ...o,
    id: o.id || `obj_${i}`,
    isStatic: o.isStatic ?? true,
    hp: o.hp ?? 100,
    speed: o.speed ?? 5,
    tag: o.tag ?? '',
  }));

  return (
    <div className="h-screen relative bg-dark-900 overflow-hidden">
      <HUD
        hp={hp}
        score={score}
        gameName={game.name}
        paused={paused}
        onTogglePause={() => setPaused(!paused)}
      />

      {collisionMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-neon-green/20 border border-neon-green/40 rounded-lg">
          <span className="text-sm font-bold text-neon-green">{collisionMessage}</span>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 4, 8], fov: 60 }}
        gl={{ antialias: true }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <GameScene
          objects={objects}
          keys={keysRef}
          paused={paused}
          setPaused={setPaused}
          hp={hp}
          setHp={setHp}
          score={score}
          setScore={setScore}
          gameName={game.name}
          setCollisionMessage={setCollisionMessage}
        />
      </Canvas>
    </div>
  );
}
