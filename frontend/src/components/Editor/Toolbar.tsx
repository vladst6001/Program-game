import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { gamesApi } from '../../api/games';
import { useParams } from 'react-router-dom';

export default function Toolbar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const addObject = useEditorStore((s) => s.addObject);
  const exportCode = useEditorStore((s) => s.exportCode);

  const handleAddObject = (type: 'cube' | 'sphere' | 'cylinder' | 'plane') => {
    addObject({
      name: `New ${type}`,
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#39ff14',
      visible: true,
    });
  };

  const handleSave = async () => {
    const code = exportCode();
    if (id && id !== 'new') {
      await gamesApi.update(id, { code });
    } else {
      const { data } = await gamesApi.create(code.name as string || 'Untitled Game');
      await gamesApi.update(data.id, { code });
      navigate(`/editor/${data.id}`, { replace: true });
    }
  };

  const handlePublish = async () => {
    if (!id || id === 'new') return;
    await gamesApi.publish(id);
  };

  return (
    <div className="h-12 bg-dark-800 border-b border-dark-500 flex items-center px-4 gap-3 shrink-0">
      <button onClick={() => navigate('/')} className="text-sm text-dark-500 hover:text-neon-green transition-colors">
        &larr; Gallery
      </button>

      <div className="w-px h-6 bg-dark-600" />

      <div className="flex bg-dark-700 rounded-lg p-0.5">
        <button
          onClick={() => setMode('3d')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            mode === '3d' ? 'bg-neon-green/20 text-neon-green' : 'text-gray-400 hover:text-white'
          }`}
        >
          3D
        </button>
        <button
          onClick={() => setMode('2d')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            mode === '2d' ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white'
          }`}
        >
          2D
        </button>
      </div>

      <div className="w-px h-6 bg-dark-600" />

      <div className="relative group">
        <button className="btn-neon text-xs py-1">+ Add Object</button>
        <div className="absolute top-full left-0 mt-1 bg-dark-700 border border-dark-500 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
          {(['cube', 'sphere', 'cylinder', 'plane'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleAddObject(type)}
              className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 hover:text-neon-green capitalize transition-colors"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <button onClick={handleSave} className="btn-neon text-xs py-1">Save</button>
      <button onClick={handlePublish} className="btn-neon-blue text-xs py-1" disabled={!id || id === 'new'}>
        Publish
      </button>

      <button onClick={() => navigate('/profile')} className="text-xs text-gray-400 hover:text-neon-blue transition-colors">
        Profile
      </button>
    </div>
  );
}
