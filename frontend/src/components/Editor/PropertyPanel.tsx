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
  const removeObject = useEditorStore((s) => s.removeObject);
  const duplicateObject = useEditorStore((s) => s.duplicateObject);
  const toggleVisibility = useEditorStore((s) => s.toggleVisibility);
  const gameName = useEditorStore((s) => s.gameName);
  const setGameName = useEditorStore((s) => s.setGameName);

  const selected = objects.find((o) => o.id === selectedObjectId);

  return (
    <div className="w-60 bg-dark-800 border-l border-dark-500 flex flex-col shrink-0">
      <div className="p-3 border-b border-dark-500">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Свойства</span>
      </div>

      {selected ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Объект</span>
            <input
              value={selected.name}
              onChange={(e) => updateObject(selected.id, { name: e.target.value })}
              className="input-dark w-full text-sm"
            />
            <div className="flex gap-1">
              <button
                onClick={() => duplicateObject(selected.id)}
                className="flex-1 text-[10px] py-1 bg-dark-700 rounded border border-dark-500 text-gray-300 hover:text-neon-green hover:border-neon-green/40 transition-colors"
              >
                Копировать
              </button>
              <button
                onClick={() => toggleVisibility(selected.id)}
                className="flex-1 text-[10px] py-1 bg-dark-700 rounded border border-dark-500 text-gray-300 hover:text-neon-blue hover:border-neon-blue/40 transition-colors"
              >
                {selected.visible ? '👁 Скрыть' : '👁‍🗨 Показать'}
              </button>
              <button
                onClick={() => removeObject(selected.id)}
                className="flex-1 text-[10px] py-1 bg-dark-700 rounded border border-dark-500 text-gray-300 hover:text-red-400 hover:border-red-400/40 transition-colors"
              >
                🗑 Удалить
              </button>
            </div>
          </div>

          <Vec3Input
            label="Позиция"
            value={selected.position}
            onChange={(v) => updateObject(selected.id, { position: v })}
          />

          <Vec3Input
            label="Поворот"
            value={selected.rotation}
            onChange={(v) => updateObject(selected.id, { rotation: v })}
            min={-360}
            max={360}
            step={15}
          />

          <Vec3Input
            label="Масштаб"
            value={selected.scale}
            onChange={(v) => updateObject(selected.id, { scale: v })}
            min={0.1}
            max={50}
            step={0.1}
          />

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Цвет</span>
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
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Быстрые цвета</span>
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

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Тип</span>
            <select
              value={selected.type}
              onChange={(e) => updateObject(selected.id, { type: e.target.value as any })}
              className="input-dark w-full text-sm"
            >
              <option value="cube">Куб</option>
              <option value="sphere">Сфера</option>
              <option value="cylinder">Цилиндр</option>
              <option value="plane">Плоскость</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Тег объекта</span>
            <input
              value={selected.tag}
              onChange={(e) => updateObject(selected.id, { tag: e.target.value })}
              className="input-dark w-full text-sm"
              placeholder="имя_для_кода"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.isStatic}
                onChange={(e) => updateObject(selected.id, { isStatic: e.target.checked })}
                className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-neon-green focus:ring-neon-green/40"
              />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Статический (не падает)</span>
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Роль объекта</span>
            <select
              value={selected.role || "object"}
              onChange={(e) => updateObject(selected.id, { role: e.target.value as any })}
              className="input-dark w-full text-sm"
            >
              <option value="object">Обычный объект</option>
              <option value="player">🎮 Игрок (управление WASD)</option>
              <option value="npc">🤖 NPC (управляется кодом)</option>
              <option value="camera">📷 Камера</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">HP (здоровье)</span>
            <input
              type="number"
              value={selected.hp}
              min={0}
              max={9999}
              onChange={(e) => updateObject(selected.id, { hp: parseInt(e.target.value) || 0 })}
              className="input-dark w-full text-sm"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Скорость</span>
            <input
              type="number"
              value={selected.speed}
              min={0}
              max={100}
              step={0.5}
              onChange={(e) => updateObject(selected.id, { speed: parseFloat(e.target.value) || 0 })}
              className="input-dark w-full text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-dark-500 text-center px-4">Выбери объект для редактирования</p>
        </div>
      )}
    </div>
  );
}
