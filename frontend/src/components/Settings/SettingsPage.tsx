import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const THEMES = [
  { id: 'neon', name: 'Неон', bg: '#0a0a0f', accent: '#39ff14', card: '#12121a', text: '#e2e8f0' },
  { id: 'ocean', name: 'Океан', bg: '#0a0f1a', accent: '#00aaff', card: '#0f1a2e', text: '#e2e8f0' },
  { id: 'sunset', name: 'Закат', bg: '#1a0a0a', accent: '#ff6600', card: '#2e0f0f', text: '#e2e8f0' },
  { id: 'forest', name: 'Лес', bg: '#0a1a0a', accent: '#44cc44', card: '#0f2e0f', text: '#e2e8f0' },
  { id: 'purple', name: 'Фиолет', bg: '#0f0a1a', accent: '#bf00ff', card: '#1a0f2e', text: '#e2e8f0' },
  { id: 'dark', name: 'Тёмная', bg: '#111111', accent: '#ffffff', card: '#1a1a1a', text: '#e2e8f0' },
  { id: 'light', name: 'Светлая', bg: '#f5f5f5', accent: '#333333', card: '#ffffff', text: '#333333' },
  { id: 'cyberpunk', name: 'Киберпанк', bg: '#0a0014', accent: '#ff00ff', card: '#140028', text: '#e2e8f0' },
];

const LANGUAGES = [
  { id: 'ru', name: 'Русский', flag: '🇷🇺' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'be', name: 'Беларуская', flag: '🇧🇾' },
];

function applyTheme(themeId: string) {
  const t = THEMES.find(t => t.id === themeId);
  if (!t) return;
  document.documentElement.style.background = t.bg;
  document.body.style.background = t.bg;
  document.body.style.color = t.text;
  document.documentElement.style.setProperty('--neon', t.accent);

  document.querySelectorAll('.bg-dark-900').forEach(el => (el as HTMLElement).style.background = t.bg);
  document.querySelectorAll('.bg-dark-800').forEach(el => (el as HTMLElement).style.background = t.card);
  document.querySelectorAll('.bg-dark-700').forEach(el => (el as HTMLElement).style.background = t.card);
}

function applyFontSize(size: string) {
  document.documentElement.style.fontSize = size + 'px';
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'neon');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || '14');
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('showGrid') !== 'false');
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem('autoSave') !== 'false');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [saved, setSaved] = useState(false);

  // Apply theme immediately when it changes
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { applyFontSize(fontSize); }, [fontSize]);

  const save = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('lang', lang);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('showGrid', String(showGrid));
    localStorage.setItem('autoSave', String(autoSave));
    localStorage.setItem('soundEnabled', String(soundEnabled));
    localStorage.setItem('userName', userName);
    applyTheme(theme);
    applyFontSize(fontSize);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-2 border-b border-dark-600">
      <span className="text-sm text-gray-300">{label}</span>
      <button onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-neon-green' : 'bg-dark-600'}`}>
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
        {saved && <span className="text-xs text-neon-green mr-2">✓ Сохранено</span>}
        <button onClick={save} className="btn-neon text-xs py-1">Сохранить</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-6">

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Имя</h3>
          <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Твоё имя" className="input-dark w-full text-sm" />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Тема</h3>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => { setTheme(t.id); applyTheme(t.id); }}
                className={`p-2 rounded-lg border text-xs text-center transition-all ${theme === t.id ? 'border-neon-green bg-dark-700' : 'border-dark-500 bg-dark-800'}`}>
                <div className="w-6 h-6 rounded-full mx-auto mb-1 border-2" style={{ background: t.bg, borderColor: t.accent }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Язык</h3>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.id} onClick={() => setLang(l.id)}
                className={`flex-1 p-2 rounded-lg border text-xs text-center ${lang === l.id ? 'border-neon-green bg-dark-700 text-white' : 'border-dark-500 bg-dark-800 text-gray-400'}`}>
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Шрифт</h3>
          <div className="flex gap-2">
            {['12', '14', '16', '18'].map((s) => (
              <button key={s} onClick={() => { setFontSize(s); applyFontSize(s); }}
                className={`flex-1 py-2 rounded-lg border text-center ${fontSize === s ? 'border-neon-green bg-dark-700 text-white' : 'border-dark-500 bg-dark-800 text-gray-400'}`}
                style={{ fontSize: s + 'px' }}>
                Aa
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Редактор</h3>
          {toggle('Автосохранение', autoSave, setAutoSave)}
          {toggle('Звуки', soundEnabled, setSoundEnabled)}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">О приложении</h3>
          <div className="bg-dark-800 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p>Game Platform v1.0</p>
            <p>Создавай и играй в 3D игры</p>
          </div>
        </div>
      </div>
    </div>
  );
}
