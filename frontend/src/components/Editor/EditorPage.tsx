import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { gamesApi } from '../../api/games';
import Toolbar from './Toolbar';
import ObjectPanel from './ObjectPanel';
import PropertyPanel from './PropertyPanel';
import Canvas3D from './Canvas3D';
import Canvas2D from './Canvas2D';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mode = useEditorStore((s) => s.mode);
  const setGameName = useEditorStore((s) => s.setGameName);
  const loadObjects = useEditorStore((s) => s.loadObjects);
  const setGameCode = useEditorStore((s) => s.setGameCode);
  const autoRegister = useAuthStore((s) => s.autoRegister);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!useAuthStore.getState().token) {
        await autoRegister();
      }
      if (id && id !== 'new') {
        try {
          const { data } = await gamesApi.get(id);
          setGameName(data.name);
          const code = data.code as any;
          const scene = code?.scene || code?.objects;
          if (Array.isArray(scene)) {
            loadObjects(scene.map((o: any, i: number) => ({
              id: o.id || `obj_${i}`,
              name: o.name || `Object ${i}`,
              type: o.type || 'cube',
              position: o.position || [0, 0, 0],
              rotation: o.rotation || [0, 0, 0],
              scale: o.scale || [1, 1, 1],
              color: o.color || '#39ff14',
              visible: true,
              modelUrl: o.modelUrl,
            })));
          }
          setGameCode(code);
        } catch {
          // Game not found - stay on editor with empty scene
        }
      }
      setReady(true);
    };
    init();
  }, [id]);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-900">
        <div className="text-neon-green animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <ObjectPanel />
        <div className="flex-1 relative">
          {mode === '3d' ? <Canvas3D /> : <Canvas2D />}
        </div>
        <PropertyPanel />
      </div>
    </div>
  );
}
