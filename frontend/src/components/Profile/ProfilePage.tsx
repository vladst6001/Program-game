import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { gamesApi, Game } from '../../api/games';
import { friendsApi, Friend } from '../../api/friends';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login, register, logout, fetchUser } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [games, setGames] = useState<Game[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
      gamesApi.list().then(({ data }) => setGames(data.games));
      friendsApi.list().then(({ data }) => setFriends(data.friends));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setNewName(user.name || '');
      setNewPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(phone, password);
      } else {
        await register(name, phone, password);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = useCallback(async () => {
    if (!friendSearch.trim()) return;
    try {
      await friendsApi.add({ name: friendSearch });
      const { data } = await friendsApi.list();
      setFriends(data.friends);
      setFriendSearch('');
    } catch (err) {
      console.error(err);
    }
  }, [friendSearch]);

  const handleSaveName = useCallback(async () => {
    if (newName.trim() && newName !== user?.name) {
      // API call to update name would go here
      setEditingName(false);
    }
  }, [newName, user?.name]);

  const handleSavePhone = useCallback(async () => {
    if (newPhone.trim() && newPhone !== user?.phone) {
      // API call to update phone would go here
      setEditingPhone(false);
    }
  }, [newPhone, user?.phone]);

  const handleSavePassword = useCallback(async () => {
    if (newPassword.length >= 6) {
      // API call to update password would go here
      setEditingPassword(false);
      setNewPassword('');
    }
  }, [newPassword]);

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-900">
        <div className="w-full max-w-sm mx-4">
          <div className="panel p-6">
            <h1 className="text-xl font-bold text-neon-green mb-6 text-center">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input-dark w-full" required />
              )}
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="input-dark w-full" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-dark w-full" required />
              <button type="submit" disabled={isLoading} className="btn-neon w-full">
                {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Register'}
              </button>
            </form>
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-4 text-xs text-gray-500 hover:text-neon-blue transition-colors w-full text-center">
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>
          <button onClick={() => navigate('/')} className="mt-4 text-xs text-gray-500 hover:text-white mx-auto block">&larr; Back to Gallery</button>
        </div>
      </div>
    );
  }

  const avatarLetter = (user?.name || '?')[0].toUpperCase();
  const gradients = ['from-neon-green to-neon-blue', 'from-neon-blue to-purple-500', 'from-purple-500 to-neon-green'];

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <div className="h-14 bg-dark-800 border-b border-dark-500 flex items-center px-6 shrink-0">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">&larr; Gallery</button>
        <h1 className="ml-4 text-lg font-bold text-neon-green">Profile</h1>
        <div className="flex-1" />
        <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Logout</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {/* Avatar + Info */}
        <div className="panel p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradients[0]} flex items-center justify-center text-2xl font-bold text-dark-900`}>
              {avatarLetter}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{user?.name}</h2>
              <p className="text-xs text-gray-500 mt-1">{user?.phone || user?.email || 'No contact info'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-neon-green">{games.length}</div>
              <div className="text-[10px] text-gray-500 mt-1">Игры</div>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-neon-blue">{friends.length}</div>
              <div className="text-[10px] text-gray-500 mt-1">Друзья</div>
            </div>
          </div>
        </div>

        {/* Created Games */}
        <div className="panel p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Мои игры ({games.length})</h2>
          <div className="space-y-2">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => navigate(`/editor/${game.id}`)}
                className="flex items-center justify-between p-3 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors group"
              >
                <span className="text-sm text-white group-hover:text-neon-green transition-colors">{game.name}</span>
                <div className="flex items-center gap-3">
                  {game.is_published && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-neon-green/10 text-neon-green rounded">Live</span>
                  )}
                  <span className="text-[10px] text-gray-500">♥ {game.likes}</span>
                </div>
              </div>
            ))}
            {games.length === 0 && <p className="text-xs text-dark-500 text-center py-4">No games yet</p>}
          </div>
        </div>

        {/* Settings */}
        <div className="panel p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Настройки</h2>
          <div className="space-y-3">
            {/* Name */}
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex-1">
                <span className="text-[10px] text-gray-500">Имя</span>
                {editingName ? (
                  <div className="flex gap-2 mt-1">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-dark flex-1 text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
                    <button onClick={handleSaveName} className="text-xs text-neon-green hover:text-neon-green/80">OK</button>
                    <button onClick={() => setEditingName(false)} className="text-xs text-gray-500 hover:text-gray-300">Отмена</button>
                  </div>
                ) : (
                  <p className="text-sm text-white">{user?.name}</p>
                )}
              </div>
              {!editingName && <button onClick={() => setEditingName(true)} className="text-[10px] text-neon-blue hover:text-neon-blue/80 ml-4">Изменить</button>}
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex-1">
                <span className="text-[10px] text-gray-500">Телефон</span>
                {editingPhone ? (
                  <div className="flex gap-2 mt-1">
                    <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="input-dark flex-1 text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSavePhone()} />
                    <button onClick={handleSavePhone} className="text-xs text-neon-green hover:text-neon-green/80">OK</button>
                    <button onClick={() => setEditingPhone(false)} className="text-xs text-gray-500 hover:text-gray-300">Отмена</button>
                  </div>
                ) : (
                  <p className="text-sm text-white">{user?.phone || 'Не указан'}</p>
                )}
              </div>
              {!editingPhone && <button onClick={() => setEditingPhone(true)} className="text-[10px] text-neon-blue hover:text-neon-blue/80 ml-4">Изменить</button>}
            </div>

            {/* Password */}
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div className="flex-1">
                <span className="text-[10px] text-gray-500">Пароль</span>
                {editingPassword ? (
                  <div className="flex gap-2 mt-1">
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Новый пароль" className="input-dark flex-1 text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSavePassword()} />
                    <button onClick={handleSavePassword} className="text-xs text-neon-green hover:text-neon-green/80">OK</button>
                    <button onClick={() => { setEditingPassword(false); setNewPassword(''); }} className="text-xs text-gray-500 hover:text-gray-300">Отмена</button>
                  </div>
                ) : (
                  <p className="text-sm text-white">••••••••</p>
                )}
              </div>
              {!editingPassword && <button onClick={() => setEditingPassword(true)} className="text-[10px] text-neon-blue hover:text-neon-blue/80 ml-4">Изменить</button>}
            </div>
          </div>
        </div>

        {/* Friends */}
        <div className="panel p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Друзья ({friends.length})</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Добавить по имени..."
              className="input-dark flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
            />
            <button onClick={handleAddFriend} className="btn-neon text-xs py-1">Добавить</button>
          </div>
          <div className="space-y-1">
            {friends.map((f) => (
              <div key={f.friend_id} className="flex items-center justify-between p-2 bg-dark-700 rounded">
                <span className="text-sm text-white">{f.friend_name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${f.status === 'accepted' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-blue/10 text-neon-blue'}`}>{f.status}</span>
              </div>
            ))}
            {friends.length === 0 && <p className="text-xs text-dark-500 text-center py-4">Нет друзей</p>}
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout} className="w-full py-3 bg-dark-700 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors mb-6">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
