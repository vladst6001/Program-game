import { useState, useCallback, Component, ReactNode } from 'react';
import CodeEditor from './CodeEditor';

class BlocklyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          Блок-редактор недоступен. Используйте вкладку "Код" для написания кода.
        </div>
      );
    }
    return this.props.children;
  }
}

const LazyBlockly = ({ onCodeGenerated }: { onCodeGenerated: (code: string) => void }) => {
  const [BlocklyWS, setBlocklyWS] = useState<any>(null);

  useState(() => {
    import('./BlocklyWorkspace').then((mod) => setBlocklyWS(() => mod.default));
  });

  if (!BlocklyWS) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neon-green animate-pulse text-sm">Загрузка блоков...</div>
      </div>
    );
  }

  return <BlocklyWS onCodeGenerated={onCodeGenerated} />;
};

type Tab = 'blocks' | 'code';

export default function CodePanel() {
  const [tab, setTab] = useState<Tab>('blocks');
  const [expanded, setExpanded] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleCodeGenerated = useCallback((code: string) => {
    setGeneratedCode(code);
  }, []);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-xs font-medium transition-all border-b-2 ${
      tab === t
        ? 'text-neon-green border-neon-green'
        : 'text-gray-500 border-transparent hover:text-gray-300'
    }`;

  return (
    <div className={`flex flex-col bg-dark-900 border-t border-dark-500 transition-all duration-300 ${expanded ? 'h-80' : 'h-10'}`}>
      <div className="h-10 flex items-center bg-dark-800 border-b border-dark-500 px-4 shrink-0">
        <div className="flex gap-1">
          <button onClick={() => setTab('blocks')} className={tabClass('blocks')}>Блоки</button>
          <button onClick={() => setTab('code')} className={tabClass('code')}>Код</button>
        </div>
        {tab === 'code' && generatedCode && (
          <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="ml-4 text-[10px] text-gray-500 hover:text-neon-blue">
            Копировать
          </button>
        )}
        <div className="flex-1" />
        <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white p-1">
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="flex-1 overflow-hidden">
          {tab === 'blocks' ? (
            <BlocklyErrorBoundary>
              <LazyBlockly onCodeGenerated={handleCodeGenerated} />
            </BlocklyErrorBoundary>
          ) : (
            <CodeEditor />
          )}
        </div>
      )}
    </div>
  );
}
