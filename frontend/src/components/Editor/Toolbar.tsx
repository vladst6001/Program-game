import { useNavigate } from 'react-router-dom';
import { useEditorStore, ToolMode } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { gamesApi } from '../../api/games';
import { useParams } from 'react-router-dom';
import { useState } from 'react';

interface ToolbarProps {
  onToggleCode?: () => void;
  showCode?: boolean;
  onToggleAI?: () => void;
  showAI?: boolean;
}

export default function Toolbar({ onToggleCode, showCode, onToggleAI, showAI }: ToolbarProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const toolMode = useEditorStore((s) => s.toolMode);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const addObject = useEditorStore((s) => s.addObject);
  const exportCode = useEditorStore((s) => s.exportCode);
  const gameName = useEditorStore((s) => s.gameName);
  const setGameName = useEditorStore((s) => s.setGameName);
  const autoRegister = useAuthStore((s) => s.autoRegister);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAddObject = (type: string, preset?: any) => {
    addObject({
      name: preset?.name || `New ${type}`,
      type: type as any,
      position: preset?.position || [0, 0, 0],
      rotation: [0, 0, 0],
      scale: preset?.scale || [1, 1, 1],
      color: preset?.color || '#39ff14',
      visible: true,
      isStatic: true,
      hp: 100,
      speed: 5,
      tag: '',
      role: 'object',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!useAuthStore.getState().token) await autoRegister();
      const code = exportCode();
      let gameId = id;

      if (!gameId || gameId === 'new') {
        const { data } = await gamesApi.create(gameName || 'Новая игра');
        gameId = data.id;
        navigate(`/editor/${data.id}`, { replace: true });
      }

      await gamesApi.update(gameId!, { code });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      alert('Ошибка сохранения: ' + (e as Error).message);
    }
    setSaving(false);
  };

  const handleRun = async () => {
    setSaving(true);
    try {
      if (!useAuthStore.getState().token) await autoRegister();
      const code = exportCode();
      let gameId = id;

      if (!gameId || gameId === 'new') {
        const { data } = await gamesApi.create(gameName || 'Новая игра');
        gameId = data.id;
      }

      await gamesApi.update(gameId!, { code });

      const url = `${window.location.origin}${window.location.pathname}#/play/${gameId}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error('Run failed:', e);
      alert('Ошибка запуска: ' + (e as Error).message);
    }
    setSaving(false);
  };

  const toolBtn = (t: ToolMode, icon: string, label: string) => (
    <button
      onClick={() => setToolMode(t)}
      className={`px-2 py-1 text-xs rounded transition-all ${
        toolMode === t ? 'bg-neon-green/20 text-neon-green border border-neon-green/40' : 'text-gray-400 hover:text-white border border-transparent'
      }`}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="h-12 bg-dark-800 border-b border-dark-500 flex items-center px-4 gap-2 shrink-0">
      <button onClick={() => navigate('/')} className="text-sm text-dark-500 hover:text-neon-green transition-colors">
        ← Назад
      </button>

      <div className="w-px h-6 bg-dark-600" />

      <input
        value={gameName}
        onChange={(e) => setGameName(e.target.value)}
        className="bg-dark-700 text-white text-sm px-2 py-1 rounded border border-dark-500 outline-none focus:border-neon-green/40 w-36"
        placeholder="Название..."
      />

      <div className="w-px h-6 bg-dark-600" />

      {/* 2D/3D toggle */}
      <div className="flex bg-dark-700 rounded-lg p-0.5">
        <button onClick={() => setMode('3d')} className={`px-2 py-1 text-xs rounded-md transition-all ${mode === '3d' ? 'bg-neon-green/20 text-neon-green' : 'text-gray-400'}`}>3D</button>
        <button onClick={() => setMode('2d')} className={`px-2 py-1 text-xs rounded-md transition-all ${mode === '2d' ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400'}`}>2D</button>
      </div>

      <div className="w-px h-6 bg-dark-600" />

      {/* Tool modes: Move/Rotate/Scale */}
      <div className="flex bg-dark-700 rounded-lg p-0.5 gap-0.5">
        {toolBtn('translate', '✥', 'Перемещение')}
        {toolBtn('rotate', '↻', 'Вращение')}
        {toolBtn('scale', '⊞', 'Масштаб')}
      </div>

      <div className="w-px h-6 bg-dark-600" />

      {/* Add Object */}
      <div className="relative group">
        <button className="btn-neon text-xs py-1">+ Объект</button>
        <div className="absolute top-full left-0 mt-1 bg-dark-700 border border-dark-500 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
          {[
            { type: 'cube', label: 'Куб' },
            { type: 'sphere', label: 'Сфера' },
            { type: 'cylinder', label: 'Цилиндр' },
            { type: 'plane', label: 'Плоскость' },
          ].map(({ type, label }) => (
            <button key={type} onClick={() => handleAddObject(type)} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 hover:text-neon-green transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Building tools */}
      <div className="relative group">
        <button className="btn-neon text-xs py-1">🏗 Здание</button>
        <div className="absolute top-full left-0 mt-1 bg-dark-700 border border-dark-500 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
          <button onClick={() => handleAddObject('floor', { name: 'Пол', scale: [10, 0.1, 10], color: '#555555' })} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 hover:text-neon-green">🟫 Пол</button>
          <button onClick={() => handleAddObject('wall', { name: 'Стена', scale: [4, 3, 0.2], color: '#8B4513' })} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 hover:text-neon-green">🧱 Стена</button>
          <button onClick={() => handleAddObject('stair', { name: 'Лестница', scale: [2, 1.5, 2], color: '#DEB887' })} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 hover:text-neon-green">🪜 Лестница</button>
        </div>
      </div>

      {/* Textures */}
      <div className="relative group">
        <button className="btn-neon text-xs py-1">🎨 Текстура</button>
        <div className="absolute top-full left-0 mt-1 bg-dark-700 border border-dark-500 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
          {[
            { name: 'Кирпич', color: '#8B4513' },
            { name: 'Бетон', color: '#808080' },
            { name: 'Дерево', color: '#DEB887' },
            { name: 'Металл', color: '#C0C0C0' },
            { name: 'Трава', color: '#228B22' },
            { name: 'Вода', color: '#4169E1' },
          ].map(({ name, color }) => (
            <button key={name} onClick={() => handleAddObject('cube', { name, color, isStatic: true })} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 hover:text-neon-green flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              {name}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onToggleCode} className={`text-xs px-2 py-1 rounded transition-all ${showCode ? 'bg-neon-green/20 text-neon-green' : 'text-gray-400 hover:text-white'}`}>
        {'</>'} Код
      </button>
      <button onClick={onToggleAI} className={`text-xs px-2 py-1 rounded transition-all ${showAI ? 'bg-neon-green/20 text-neon-green' : 'text-gray-400 hover:text-white'}`}>
        🤖 AI
      </button>

      <div className="flex-1" />

      <button onClick={handleSave} disabled={saving} className="btn-neon text-xs py-1">
        {saving ? '...' : saved ? '✓ Сохранено' : '💾 Save'}
      </button>
      <button onClick={handleRun} disabled={saving} className="bg-neon-green text-dark-900 text-xs py-1 px-3 rounded font-bold hover:bg-neon-green/80 transition-colors">▶ Запуск</button>
    </div>
  );
}
