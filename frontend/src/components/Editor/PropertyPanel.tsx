import { useEditorStore } from '../../store/editorStore';

function Vec3Input({
  label,
  value,
  onChange,
  min = -100,
  max = 100,
  step = 0.5,
}: {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const update = (idx: number, val: string) => {
    const num = parseFloat(val) || 0;
    const next = [...value] as [number, number, number];
    next[idx] = Math.round(num / step) * step;
    onChange(next);
  };

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex gap-1">
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <div key={axis} className="flex-1">
            <span className="text-[9px] text-dark-500 uppercase">{axis}</span>
            <input
              type="number"
              value={value[i]}
              min={min}
              max={max}
              step={step}
              onChange={(e) => update(i, e.target.value)}
              className="input-dark w-full text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertyPanel() {
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const objects = useEditorStore((s) => s.objects);
  const updateObject = useEditorStore((s) => s.updateObject);
  const gameName = useEditorStore((s) => s.gameName);
  const setGameName = useEditorStore((s) => s.setGameName);

  const selected = objects.find((o) => o.id === selectedObjectId);

  return (
    <div className="w-60 bg-dark-800 border-l border-dark-500 flex flex-col shrink-0">
      <div className="p-3 border-b border-dark-500">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</span>
      </div>

      <div className="p-3 border-b border-dark-500 space-y-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Game</span>
        <input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          className="input-dark w-full text-sm"
          placeholder="Game name"
        />
      </div>

      {selected ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Object</span>
            <input
              value={selected.name}
              onChange={(e) => updateObject(selected.id, { name: e.target.value })}
              className="input-dark w-full text-sm"
            />
            <select
              value={selected.type}
              onChange={(e) => updateObject(selected.id, { type: e.target.value as any })}
              className="input-dark w-full text-sm"
            >
              <option value="cube">Cube</option>
              <option value="sphere">Sphere</option>
              <option value="cylinder">Cylinder</option>
              <option value="plane">Plane</option>
              <option value="gltf">GLTF Model</option>
              <option value="obj">OBJ Model</option>
            </select>
          </div>

          <Vec3Input
            label="Position"
            value={selected.position}
            onChange={(v) => updateObject(selected.id, { position: v })}
          />

          <Vec3Input
            label="Rotation"
            value={selected.rotation}
            onChange={(v) => updateObject(selected.id, { rotation: v })}
            min={-360}
            max={360}
            step={15}
          />

          <Vec3Input
            label="Scale"
            value={selected.scale}
            onChange={(v) => updateObject(selected.id, { scale: v })}
            min={0.1}
            max={50}
            step={0.1}
          />

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Color</span>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={selected.color}
                onChange={(e) => updateObject(selected.id, { color: e.target.value })}
                className="w-8 h-8 rounded border border-dark-500 cursor-pointer bg-transparent"
              />
              <input
                value={selected.color}
                onChange={(e) => updateObject(selected.id, { color: e.target.value })}
                className="input-dark flex-1 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Quick Colors</span>
            <div className="flex gap-1 flex-wrap">
              {['#39ff14', '#00f0ff', '#bf00ff', '#ff00ff', '#ff3366', '#ffaa00', '#ffffff', '#333333'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateObject(selected.id, { color: c })}
                  className="w-5 h-5 rounded border border-dark-500 transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-dark-500 text-center px-4">Select an object to edit its properties</p>
        </div>
      )}
    </div>
  );
}
