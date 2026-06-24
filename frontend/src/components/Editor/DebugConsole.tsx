import { useEffect, useRef, useState, useCallback } from 'react';

interface LogEntry {
  id: number;
  type: 'log' | 'warn' | 'error' | 'info';
  text: string;
  timestamp: string;
}

interface DebugConsoleProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

let logId = 0;

export default function DebugConsole({ collapsed = false, onToggle }: DebugConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    const entry: LogEntry = {
      id: ++logId,
      type,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLogs((prev) => [...prev.slice(-200), entry]);
  }, []);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    };
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    };
    console.error = (...args) => {
      originalError(...args);
      addLog('error', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    };
    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, [addLog]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    onToggle?.();
  }, [onToggle]);

  const typeStyles: Record<LogEntry['type'], string> = {
    log: 'text-gray-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-neon-blue',
  };

  const typeBadge: Record<LogEntry['type'], string> = {
    log: '',
    warn: '[WARN] ',
    error: '[ERROR] ',
    info: '[INFO] ',
  };

  return (
    <div
      className={`flex flex-col bg-[#0a0f1a] border-t border-dark-500 transition-all duration-300 ${
        isExpanded ? 'h-48' : 'h-8'
      }`}
    >
      <div className="h-8 flex items-center justify-between px-3 bg-dark-800 border-b border-dark-500 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpand}
            className="text-gray-500 hover:text-white transition-colors"
            title={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="text-[11px] font-medium text-gray-400">Консоль</span>
          {logs.length > 0 && (
            <span className="text-[9px] text-gray-600">({logs.length})</span>
          )}
        </div>
        <button
          onClick={clearLogs}
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          title="Очистить"
        >
          Очистить
        </button>
      </div>

      {isExpanded && (
        <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-0.5">
          {logs.length === 0 ? (
            <div className="text-gray-600 text-[11px]">Вывод консоли будет здесь...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`flex gap-2 ${typeStyles[log.type]}`}>
                <span className="text-gray-700 shrink-0">{log.timestamp}</span>
                <span className="shrink-0 font-bold">{typeBadge[log.type]}</span>
                <span className="break-all">{log.text}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

export function captureGameOutput(): {
  restore: () => void;
  getLogs: () => LogEntry[];
} {
  const capturedLogs: LogEntry[] = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  const capture = (type: LogEntry['type']) => (...args: unknown[]) => {
    capturedLogs.push({
      id: ++logId,
      type,
      text: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
      timestamp: new Date().toISOString(),
    });
  };

  console.log = capture('log');
  console.warn = capture('warn');
  console.error = capture('error');

  return {
    restore: () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    },
    getLogs: () => [...capturedLogs],
  };
}
