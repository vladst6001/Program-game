import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinGamePage() {
  const [gameId, setGameId] = useState('');
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-dark-900">
      <div className="bg-dark-800 border border-dark-500 rounded-xl p-8 w-full max-w-md">
        <h2 className="text-lg font-bold text-neon-green mb-2">🔑 Войти по ID</h2>
        <p className="text-xs text-gray-500 mb-6">Введи ID игры из Telegram чтобы продолжить редактирование</p>

        <input
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && gameId.trim()) {
              navigate(`/editor/${gameId.trim()}`);
            }
          }}
          placeholder="Вставь ID игры из бота"
          className="input-dark w-full text-sm mb-4 font-mono"
        />

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (gameId.trim()) navigate(`/editor/${gameId.trim()}`);
            }}
            disabled={!gameId.trim()}
            className="flex-1 btn-neon text-sm py-2"
          >
            ✏️ Редактировать
          </button>
          <button
            onClick={() => {
              if (gameId.trim()) navigate(`/play/${gameId.trim()}`);
            }}
            disabled={!gameId.trim()}
            className="flex-1 btn-neon-blue text-sm py-2"
          >
            ▶ Играть
          </button>
        </div>

        <button onClick={() => navigate('/')} className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors mt-4">
          ← Назад в галерею
        </button>
      </div>
    </div>
  );
}
