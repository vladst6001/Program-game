import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messagesApi, ChatMessage } from '../../api/messages';
import { useAuthStore } from '../../store/authStore';

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const connectWs = useCallback(() => {
    const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    try {
      const ws = new WebSocket(`${wsBase}/ws/chat/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        ws.send(JSON.stringify({ type: 'join', user_id: user?.id }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.payload.id)) return prev;
              return [...prev.slice(-49), data.payload];
            });
          } else if (data.type === 'typing') {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => ws.close();
    } catch {}
  }, [sessionId, user?.id]);

  useEffect(() => {
    messagesApi.getChatMessages(sessionId!).then(({ data }) => {
      setMessages(data.messages.slice(-50));
    }).catch(() => {}).finally(() => setLoading(false));

    connectWs();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [sessionId, connectWs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      const { data } = await messagesApi.sendChatMessage(sessionId!, { text: trimmed });
      setMessages((prev) => [...prev.slice(-49), data]);
    } catch {
      setText(trimmed);
    }
  }, [text, sessionId]);

  const handleTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', user_id: user?.id }));
    }
  }, [user?.id]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'voice.webm');

        try {
          const token = localStorage.getItem('token');
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const uploadRes = await fetch(`${baseUrl}/api/upload/voice`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const { url } = await uploadRes.json();

          const { data } = await messagesApi.sendChatMessage(sessionId!, { voice_url: url });
          setMessages((prev) => [...prev.slice(-49), data]);
        } catch {}

        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {}
  }, [sessionId]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <div className="h-14 bg-dark-800 border-b border-dark-500 flex items-center px-6 shrink-0">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">
          &larr;
        </button>
        <h1 className="ml-4 text-sm font-bold text-neon-green">Chat</h1>
        <span className="ml-2 text-[10px] text-dark-500">Session {sessionId?.slice(0, 8)}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-neon-green' : 'bg-gray-500'}`} />
          <span className="text-[10px] text-gray-500">{wsConnected ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-dark-500">Нет сообщений. Скажите привет!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    isMe
                      ? 'bg-neon-green/10 border border-neon-green/20 text-white'
                      : 'bg-dark-700 border border-dark-500 text-gray-300'
                  }`}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.voice_url && (
                    <audio controls src={msg.voice_url} className="mt-1 h-8" />
                  )}
                  <span className="block text-[9px] text-gray-600 mt-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-dark-700 border border-dark-500 px-3 py-2 rounded-xl flex gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-dark-800 border-t border-dark-500">
        <div className="flex gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              isRecording
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse'
                : 'bg-dark-700 border border-dark-500 text-gray-400 hover:text-white'
            }`}
            title={isRecording ? 'Остановить запись' : 'Голосовое сообщение'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isRecording ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </>
              )}
            </svg>
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="input-dark flex-1"
          />
          <button onClick={handleSend} disabled={!text.trim()} className="btn-neon text-xs py-1 px-4">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
