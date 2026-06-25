import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const THEMES = [
  { id: 'neon', name: 'Неон', bg: '#0a0a0f', accent: '#39ff14', accent2: '#00f0ff', card: '#12121a' },
  { id: 'ocean', name: 'Океан', bg: '#0a0f1a', accent: '#00aaff', accent2: '#0066cc', card: '#0f1a2e' },
  { id: 'sunset', name: 'Закат', bg: '#1a0a0a', accent: '#ff6600', accent2: '#ff3366', card: '#2e0f0f' },
  { id: 'forest', name: 'Лес', bg: '#0a1a0a', accent: '#44cc44', accent2: '#228822', card: '#0f2e0f' },
  { id: 'purple', name: 'Фиолет', bg: '#0f0a1a', accent: '#bf00ff', accent2: '#7700cc', card: '#1a0f2e' },
  { id: 'dark', name: 'Тёмная', bg: '#111111', accent: '#ffffff', accent2: '#888888', card: '#1a1a1a' },
  { id: 'light', name: 'Светлая', bg: '#f5f5f5', accent: '#333333', accent2: '#666666', card: '#ffffff' },
  { id: 'cyberpunk', name: 'Киберпанк', bg: '#0a0014', accent: '#ff00ff', accent2: '#00ffff', card: '#140028' },
];

const LANGUAGES = [
  { id: 'ru', name: 'Русский', flag: '🇷🇺' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'be', name: 'Беларуская', flag: '🇧🇾' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'neon');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || '14');
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('showGrid') !== 'false');
  const [showAxes, setShowAxes] = useState(() => localStorage.getItem('showAxes') !== 'false');
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem('autoSave') !== 'false');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = THEMES.find(t => t.id === theme);
    if (t) {
      document.documentElement.style.setProperty('--bg', t.bg);
      document.documentElement.style.setProperty('--accent', t.accent);
    }
  }, [theme]);

  const save = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('lang', lang);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('showGrid', String(showGrid));
    localStorage.setItem('showAxes', String(showAxes));
    localStorage.setItem('autoSave', String(autoSave));
    localStorage.setItem('soundEnabled', String(soundEnabled));
    localStorage.setItem('userName', userName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const section = (title: string) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
    </div>
  );

  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-neon-green' : 'bg-dark-600'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <div className="h-12 bg-dark-800 border-b border-dark-500 flex items-center px-4 shrink-0">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-neon-green mr-4">←</button>
        <span className="text-sm font-bold text-neon-green">⚙️ Настройки</span>
        <div className="flex-1" />
        {saved && <span className="text-xs text-neon-green">✓ Сохранено</span>}
        <button onClick={save} className="btn-neon text-xs py-1 ml-3">Сохранить</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        {section('Имя')}
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Твоё имя"
          className="input-dark w-full text-sm mb-4"
        />

        {section('Тема')}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-2 rounded-lg border text-xs text-center transition-all ${
                theme === t.id
                  ? 'border-neon-green bg-dark-700'
                  : 'border-dark-500 bg-dark-800 hover:border-dark-500'
              }`}
            >
              <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ background: t.bg, border: `2px solid ${t.accent}` }} />
              {t.name}
            </button>
          ))}
        </div>

        {section('Язык')}
        <div className="flex gap-2 mb-4">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`flex-1 p-2 rounded-lg border text-xs text-center ${
                lang === l.id ? 'border-neon-green bg-dark-700 text-white' : 'border-dark-500 bg-dark-800 text-gray-400'
              }`}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>

        {section('Шрифт')}
        <div className="flex gap-2 mb-4">
          {['12', '14', '16', '18'].map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`flex-1 py-2 rounded-lg border text-center ${
                fontSize === s ? 'border-neon-green bg-dark-700 text-white' : 'border-dark-500 bg-dark-800 text-gray-400'
              }`}
              style={{ fontSize: s + 'px' }}
            >
              Aa
            </button>
          ))}
        </div>

        {section('Редактор')}
        {toggle('Показывать сетку', showGrid, setShowGrid)}
        {toggle('Показывать оси', showAxes, setShowAxes)}
        {toggle('Автосохранение', autoSave, setAutoSave)}
        {toggle('Звуки', soundEnabled, setSoundEnabled)}

        {section('О приложении')}
        <div className="bg-dark-800 rounded-lg p-3 text-xs text-gray-500 space-y-1">
          <p>Game Platform v1.0</p>
          <p>Создавай и играй в 3D игры</p>
          <p>React + Three.js + Blockly</p>
        </div>
      </div>
    </div>
  );
}
