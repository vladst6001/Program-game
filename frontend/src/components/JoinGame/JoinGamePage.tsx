import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinGamePage() {
  const [gameId, setGameId] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (gameId.trim()) {
      navigate(`/play/${gameId.trim()}`);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-dark-900">
      <div className="bg-dark-800 border border-dark-500 rounded-xl p-8 w-full max-w-md">
        <h2 className="text-lg font-bold text-neon-green mb-2">🎮 Войти в игру</h2>
        <p className="text-xs text-gray-500 mb-6">Введи ID игры которую тебе дал создатель</p>

        <input
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="ID игры (напр. abc123-def456)"
          className="input-dark w-full text-sm mb-4 font-mono"
        />

        <button onClick={handleJoin} disabled={!gameId.trim()} className="btn-neon w-full text-sm py-2 mb-3">
          ▶ Войти в игру
        </button>

        <button onClick={() => navigate('/')} className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← Назад в галерею
        </button>
      </div>
    </div>
  );
}
