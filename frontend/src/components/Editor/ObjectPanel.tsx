import { useEditorStore, EditorObject } from '../../store/editorStore';
import { useState, useRef } from 'react';

export default function ObjectPanel() {
  const objects = useEditorStore((s) => s.objects);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const removeObject = useEditorStore((s) => s.removeObject);
  const toggleVisibility = useEditorStore((s) => s.toggleVisibility);
  const duplicateObject = useEditorStore((s) => s.duplicateObject);
  const addObject = useEditorStore((s) => s.addObject);

  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);

  const icons: Record<string, string> = {
    cube: '◼',
    sphere: '●',
    cylinder: '◗',
    plane: '▬',
    gltf: '📦',
    obj: '📦',
    group: '📁',
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase();
    addObject({
      name: file.name,
      type: ext === 'obj' ? 'obj' : 'gltf',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#39ff14',
      visible: true,
      modelUrl: url,
      isStatic: true,
      hp: 100,
      speed: 5,
      tag: '',
      isPlayer: false,
    });
    e.target.value = '';
  };

  return (
    <div className="w-56 bg-dark-800 border-r border-dark-500 flex flex-col shrink-0">
      <div className="p-3 border-b border-dark-500 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Objects</span>
        <div className="flex gap-1">
          <label className="btn-neon text-[10px] py-0.5 px-2 cursor-pointer">
            Import
            <input type="file" accept=".glb,.gltf,.obj" className="hidden" onChange={handleFileImport} />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {objects.length === 0 && (
          <div className="text-center text-xs text-dark-500 py-8">
            No objects yet. Click "+ Add Object" to start.
          </div>
        )}

        {objects.map((obj, idx) => (
          <div
            key={obj.id}
            draggable
            onDragStart={() => { dragIdx.current = idx; }}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
            onDragEnd={() => setDragOverIdx(null)}
            onClick={() => selectObject(obj.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all text-sm group ${
              selectedObjectId === obj.id
                ? 'bg-neon-green/10 border border-neon-green/30'
                : 'hover:bg-dark-700 border border-transparent'
            } ${dragOverIdx === idx ? 'border-t-2 border-neon-blue' : ''}`}
          >
            <span className="text-xs w-4 text-center opacity-60">
              {icons[obj.type] || '◼'}
            </span>

            <input
              className="flex-1 bg-transparent text-xs outline-none min-w-0 truncate"
              value={obj.name}
              onChange={(e) => {
                const store = useEditorStore.getState();
                store.updateObject(obj.id, { name: e.target.value });
              }}
              onClick={(e) => e.stopPropagation()}
            />

            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); toggleVisibility(obj.id); }}
                className="text-[10px] p-0.5 hover:text-neon-green transition-colors"
                title={obj.visible ? 'Hide' : 'Show'}
              >
                {obj.visible ? '👁' : '👁‍🗨'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }}
                className="text-[10px] p-0.5 hover:text-neon-blue transition-colors"
                title="Duplicate"
              >
                ⧉
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
                className="text-[10px] p-0.5 hover:text-red-400 transition-colors"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
