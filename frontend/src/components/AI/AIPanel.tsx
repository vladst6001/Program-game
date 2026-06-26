import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface AIMessage {
  role: 'user' | 'ai';
  text: string;
}

const AI_RESPONSES: Record<string, () => { text: string; action?: () => void }> = {
  'кот': () => ({
    text: '🐱 Создаю кота! Куб с оранжевым цветом, добавляю тег "cat".',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Кот', type: 'cube', position: [0, 1, 0], rotation: [0, 0, 0],
        scale: [0.8, 0.8, 0.8], color: '#ff8800', visible: true,
        isStatic: false, hp: 50, speed: 6, tag: 'cat', role: 'npc',
      });
    },
  }),
  'персонаж': () => ({
    text: '🧑 Создаю персонажа! Куб зелёного цвета, роль "Игрок".',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Герой', type: 'cube', position: [0, 1, 0], rotation: [0, 0, 0],
        scale: [1, 1, 1], color: '#39ff14', visible: true,
        isStatic: false, hp: 100, speed: 8, tag: 'player', role: 'player',
      });
    },
  }),
  'враг': () => ({
    text: '👹 Создаю врага! Сфера красного цвета, роль "NPC".',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Враг', type: 'sphere', position: [5, 1, 0], rotation: [0, 0, 0],
        scale: [1, 1, 1], color: '#ff0066', visible: true,
        isStatic: false, hp: 50, speed: 3, tag: 'enemy', role: 'npc',
      });
    },
  }),
  'монета': () => ({
    text: '🪙 Создаю монету! Маленькая жёлтая сфера.',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Монета', type: 'sphere', position: [3, 1.5, 0], rotation: [0, 0, 0],
        scale: [0.3, 0.3, 0.3], color: '#ffcc00', visible: true,
        isStatic: true, hp: 1, speed: 0, tag: 'coin', role: 'object',
      });
    },
  }),
  'пол': () => ({
    text: '🟫 Создаю пол! большая плоскость серого цвета.',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Пол', type: 'floor', position: [0, 0, 0], rotation: [0, 0, 0],
        scale: [10, 0.1, 10], color: '#555555', visible: true,
        isStatic: true, hp: 999, speed: 0, tag: 'floor', role: 'object',
      });
    },
  }),
  'стена': () => ({
    text: '🧱 Создаю стену! Высокий тонкий блок коричневого цвета.',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Стена', type: 'wall', position: [0, 1.5, -5], rotation: [0, 0, 0],
        scale: [10, 3, 0.3], color: '#8B4513', visible: true,
        isStatic: true, hp: 999, speed: 0, tag: 'wall', role: 'object',
      });
    },
  }),
  'камера': () => ({
    text: '📷 Создаю камеру! Жёлтый куб — точка наблюдения.',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Камера', type: 'camera', position: [0, 5, 10], rotation: [-30, 0, 0],
        scale: [0.5, 0.5, 0.5], color: '#ffaa00', visible: true,
        isStatic: true, hp: 999, speed: 0, tag: 'camera', role: 'camera',
      });
    },
  }),
  'дерево': () => ({
    text: '🌳 Создаю дерево! Зелёный цилиндр (ствол) + сфера (крона).',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({
        name: 'Ствол', type: 'cylinder', position: [3, 1, 0], rotation: [0, 0, 0],
        scale: [0.3, 2, 0.3], color: '#8B4513', visible: true,
        isStatic: true, hp: 999, speed: 0, tag: 'tree_trunk', role: 'object',
      });
      store.addObject({
        name: 'Крона', type: 'sphere', position: [3, 2.5, 0], rotation: [0, 0, 0],
        scale: [1.5, 1.5, 1.5], color: '#228B22', visible: true,
        isStatic: true, hp: 999, speed: 0, tag: 'tree_top', role: 'object',
      });
    },
  }),
  'комната': () => ({
    text: '🏠 Создаю комнату! Пол + 4 стены.',
    action: () => {
      const store = useEditorStore.getState();
      store.addObject({ name: 'Пол', type: 'floor', position: [0, 0, 0], rotation: [0, 0, 0], scale: [8, 0.1, 8], color: '#555555', visible: true, isStatic: true, hp: 999, speed: 0, tag: 'floor', role: 'object' });
      store.addObject({ name: 'Стена зад', type: 'wall', position: [0, 1.5, -4], rotation: [0, 0, 0], scale: [8, 3, 0.3], color: '#8B4513', visible: true, isStatic: true, hp: 999, speed: 0, tag: 'wall', role: 'object' });
      store.addObject({ name: 'Стена лев', type: 'wall', position: [-4, 1.5, 0], rotation: [0, 90, 0], scale: [8, 3, 0.3], color: '#8B4513', visible: true, isStatic: true, hp: 999, speed: 0, tag: 'wall', role: 'object' });
      store.addObject({ name: 'Стена прав', type: 'wall', position: [4, 1.5, 0], rotation: [0, 90, 0], scale: [8, 3, 0.3], color: '#8B4513', visible: true, isStatic: true, hp: 999, speed: 0, tag: 'wall', role: 'object' });
    },
  }),
  'прыжок': () => ({
    text: '跳跃 Код для прыжка:\n\nПри нажатии Пробел:\n  Если игрок на земле:\n    Установить скорость Y = 10\n    Установить "на земле" = ложь\n\nКаждый кадр:\n  Если "на земле" ложь:\n    Увеличить скорость Y на -0.5\n    Переместить игрока на скорость Y\n    Если игрок ниже пола:\n      Установить "на земле" = истина',
  }),
  'движение': () => ({
    text: '🏃 Код для движения:\n\nКаждый кадр:\n  Если нажата W → двигать вперёд\n  Если нажата S → двигать назад\n  Если нажата A → двигать влево\n  Если нажата D → двигать вправо\n\nИспользуй блоки:\n- "Каждый кадр"\n- "Если нажата клавиша [W]" → "Двигать [игрок] на X=0 Y=0 Z=1"',
  }),
  'здоровье': () => ({
    text: '❤️ Код для здоровья:\n\nПри старте:\n  Установить HP игрока = 100\n\nПри столкновении с врагом:\n  Уменьшить HP игрока на 10\n  Если HP <= 0:\n    Показать "Game Over"\n\nИспользуй блоки:\n- "При старте" → "Установить HP [игрок] = 100"\n- "При столкновении" → "Изменить HP [игрок] на -10"',
  }),
  'помощь': () => ({
    text: '🤖 Я могу помочь с созданием игр!\n\nПопробуй написать:\n- "Создай кота" — создам персонажа\n- "Сделай пол" — создам основание\n- "Добавь врага" — создам противника\n- "Сделай комнату" — создам помещение\n- "Как сделать движение?" — покажу код\n- "Как сделать прыжок?" — покажу код\n- "Как сделать здоровье?" — покажу код\n- "Создай дерево" — создам дерево\n- "Создай камеру" — добавлю камеру',
  }),
};

function findResponse(input: string): { text: string; action?: () => void } | null {
  const lower = input.toLowerCase();
  for (const [keyword, handler] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(keyword)) {
      return handler();
    }
  }
  return null;
}

export default function AIPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'ai', text: '🤖 Привет! Я AI-помощник. Опиши что хочешь создать, и я помогу!\n\nНапример: "создай кота", "сделай пол", "как сделать движение?"' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');

    setTimeout(() => {
      const response = findResponse(text);
      if (response) {
        if (response.action) response.action();
        setMessages((prev) => [...prev, { role: 'ai', text: response.text }]);
      } else {
        setMessages((prev) => [...prev, {
          role: 'ai',
          text: '🤔 Не совсем понял. Попробуй:\n- "создай кота"\n- "сделай пол"\n- "как сделать движение?"\n- "помощь"',
        }]);
      }
    }, 500);
  };

  return (
    <div className="w-72 bg-dark-800 border-l border-dark-500 flex flex-col h-full">
      <div className="h-10 flex items-center justify-between px-3 border-b border-dark-500 shrink-0">
        <span className="text-xs font-bold text-neon-green">🤖 AI Помощник</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'ai' ? 'bg-dark-700 text-gray-300' : 'bg-neon-green/10 text-neon-green ml-4'}`}>
            <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-dark-500 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Опиши что создать..."
            className="input-dark flex-1 text-xs"
          />
          <button onClick={handleSend} className="btn-neon text-xs py-1 px-3">→</button>
        </div>
      </div>
    </div>
  );
}
