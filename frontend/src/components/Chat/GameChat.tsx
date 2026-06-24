import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';

interface GameMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

interface GameChatProps {
  sessionId: string;
  wsUrl?: string;
}

export default function GameChat({ sessionId, wsUrl }: GameChatProps) {
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [text, setText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectWs = useCallback(() => {
    if (!wsUrl) return;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'join', session_id: sessionId, user_id: user?.id }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            setMessages((prev) => [...prev.slice(-49), data.payload]);
          } else if (data.type === 'typing') {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => ws.close();
    } catch {}
  }, [wsUrl, sessionId, user?.id]);

  useEffect(() => {
    if (isOpen) connectWs();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      setIsConnected(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isOpen, connectWs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'message',
      session_id: sessionId,
      user_id: user?.id,
      text: trimmed,
    }));

    setMessages((prev) => [
      ...prev,
      {
        id: `local_${Date.now()}`,
        sender_id: user?.id || '',
        sender_name: user?.name || 'Вы',
        text: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);
    setText('');
  }, [text, sessionId, user]);

  const handleTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', session_id: sessionId, user_id: user?.id }));
    }
  }, [sessionId, user?.id]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-dark-700 border border-neon-green/30 flex items-center justify-center hover:border-neon-green/60 transition-all z-50 shadow-lg shadow-neon-green/10"
      >
        <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 bg-dark-800 border border-dark-500 rounded-xl flex flex-col overflow-hidden z-50 shadow-xl shadow-black/30">
      <div className="h-10 flex items-center justify-between px-3 bg-dark-700 border-b border-dark-500 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-neon-green' : 'bg-gray-500'}`} />
          <span className="text-xs font-medium text-white">Чат</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-[11px] text-gray-600 mt-8">Нет сообщений</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[9px] text-gray-500 mb-0.5 px-1">{msg.sender_name}</span>
              <div
                className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-xs ${
                  isMe
                    ? 'bg-neon-green/10 border border-neon-green/20 text-white'
                    : 'bg-dark-600 border border-dark-500 text-gray-300'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center gap-1 px-2">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 bg-dark-700 border-t border-dark-500">
        <div className="flex gap-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Сообщение..."
            className="flex-1 bg-dark-600 text-white text-xs px-3 py-1.5 rounded-lg border border-dark-500 outline-none focus:border-neon-green/40 placeholder-gray-600"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-3 py-1.5 bg-neon-green/20 text-neon-green text-xs font-medium rounded-lg hover:bg-neon-green/30 transition-colors disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
