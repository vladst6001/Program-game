import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { galleryApi } from '../../api/gallery';
import { gamesApi, Game } from '../../api/games';
import { useAuthStore } from '../../store/authStore';

const GRADIENTS = [
  'linear-gradient(135deg, #0a0f1a 0%, #00ff88 50%, #0066ff 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #cc00ff 50%, #ff6600 100%)',
  'linear-gradient(135deg, #0a1a2e 0%, #0066ff 50%, #00ff88 100%)',
  'linear-gradient(135deg, #2e0a0a 0%, #ff0066 50%, #ffcc00 100%)',
  'linear-gradient(135deg, #0a2e1a 0%, #00ff66 50%, #00ccff 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #6600ff 50%, #ff0066 100%)',
];

function GameSkeleton() {
  return (
    <div className="panel p-4 animate-pulse">
      <div className="aspect-video bg-dark-700 rounded mb-3" />
      <div className="h-3 bg-dark-600 rounded w-3/4 mb-2" />
      <div className="h-2 bg-dark-700 rounded w-1/2 mb-3" />
      <div className="flex justify-between">
        <div className="h-2 bg-dark-700 rounded w-16" />
        <div className="h-2 bg-dark-700 rounded w-8" />
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'popular' | 'recent'>('popular');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    const req = tab === 'popular' ? galleryApi.getPopular() : galleryApi.getRecent();
    req.then((response) => {
      setGames(response.data.games || []);
      setHasMore((response.data.games || []).length >= 20);
    }).finally(() => setLoading(false));
  }, [tab]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await (tab === 'popular' ? galleryApi.getPopular() : galleryApi.getRecent());
      setGames(response.data.games || []);
      setPage(nextPage);
      if ((response.data.games || []).length < 20) setHasMore(false);
    } catch {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [page, tab, loadingMore, hasMore]);

  const handleCopyGame = useCallback(async (game: Game, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/profile');
      return;
    }
    try {
      const { data: newGame } = await gamesApi.create(`${game.name} (копия)`);
      await gamesApi.update(newGame.id, { code: game.code });
      navigate(`/editor/${newGame.id}`);
    } catch {}
  }, [isAuthenticated, navigate]);

  const handlePlay = useCallback((game: Game, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/play/${game.id}`;
    window.open(url, '_blank');
  }, []);

  const filteredGames = games.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.author_id.toLowerCase().includes(q);
  });

  const tabClass = (t: typeof tab) =>
    `text-sm font-medium transition-colors ${
      tab === t ? (t === 'popular' ? 'text-neon-green' : 'text-neon-blue') : 'text-gray-500 hover:text-gray-300'
    }`;

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <div className="h-14 bg-dark-800 border-b border-dark-500 flex items-center px-6 shrink-0">
        <h1 className="text-lg font-bold text-neon-green">🎮 Играть</h1>
        <div className="flex-1" />
        <div className="flex gap-4">
          <button onClick={() => navigate('/tutorials')} className="text-sm text-gray-400 hover:text-neon-blue transition-colors">
            Уроки
          </button>
          <button onClick={() => navigate('/settings')} className="text-sm text-gray-400 hover:text-neon-purple transition-colors">
            ⚙️
          </button>
          <button onClick={() => navigate('/profile')} className="text-sm text-gray-400 hover:text-neon-green transition-colors">
            👤
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 pb-2">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск игр по названию или автору..."
            className="w-full bg-dark-700 text-white text-sm pl-10 pr-4 py-2 rounded-lg border border-dark-500 outline-none focus:border-neon-green/40 placeholder-gray-600"
          />
        </div>
      </div>

      <div className="flex gap-3 px-6 pb-2">
        <button onClick={() => setTab('popular')} className={tabClass('popular')}>Популярные</button>
        <button onClick={() => setTab('recent')} className={tabClass('recent')}>Новые</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => <GameSkeleton key={i} />)}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{searchQuery ? 'Игры не найдены' : 'Нет игр. Будьте первым!'}</p>
            {!searchQuery && (
              <button onClick={() => navigate('/editor/new')} className="btn-neon">Создать игру</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames.map((game, i) => (
                <div
                  key={game.id}
                  onClick={() => handlePlay(game, { stopPropagation: () => {} } as any)}
                  className="panel p-4 cursor-pointer group hover:border-neon-green/40 transition-all hover:shadow-neon-sm-green"
                >
                  <div
                    className="aspect-video rounded-lg mb-3 flex items-center justify-center overflow-hidden relative"
                    style={{ background: GRADIENTS[i % GRADIENTS.length] }}
                  >
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      <button
                        onClick={(e) => handlePlay(game, e)}
                        className="w-10 h-10 rounded-full bg-neon-green/90 flex items-center justify-center hover:bg-neon-green transition-colors"
                        title="Играть"
                      >
                        <svg className="w-4 h-4 text-dark-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/editor/${game.id}`); }}
                        className="w-8 h-8 rounded-full bg-dark-700/90 flex items-center justify-center hover:bg-dark-600 border border-dark-500"
                        title="Редактировать"
                      >
                        <span className="text-[10px] text-white">✏️</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/editor/${game.id}`); }}
                        className="w-10 h-10 rounded-full bg-dark-700/90 flex items-center justify-center hover:bg-dark-600 transition-colors border border-dark-500"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleCopyGame(game, e)}
                        className="w-10 h-10 rounded-full bg-dark-700/90 flex items-center justify-center hover:bg-dark-600 transition-colors border border-dark-500"
                        title="Копировать"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-3xl opacity-30 group-hover:opacity-0 transition-opacity">🎮</div>
                  </div>

                  <h3 className="text-sm font-medium text-white truncate group-hover:text-neon-green transition-colors">
                    {game.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-500">
                      {new Date(game.updated_at).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-neon-blue">♥ {game.likes}</span>
                  </div>
                  {game.is_published && (
                    <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 bg-neon-green/10 text-neon-green rounded">
                      Published
                    </span>
                  )}
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm text-gray-500 hover:text-neon-green transition-colors disabled:opacity-30"
                >
                  {loadingMore ? (
                    <div className="w-5 h-5 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                  ) : (
                    'Загрузить ещё'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
