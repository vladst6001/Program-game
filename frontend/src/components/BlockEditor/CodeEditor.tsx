import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';

export default function CodeEditor() {
  const gameCode = useEditorStore((s) => s.gameCode);
  const setGameCode = useEditorStore((s) => s.setGameCode);
  const [code, setCode] = useState('');
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const script = (gameCode as Record<string, unknown>)?.script;
    if (typeof script === 'string') {
      setCode(script);
      setLineCount(script.split('\n').length);
    }
  }, [gameCode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCode(value);
    setLineCount(value.split('\n').length);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setGameCode({ script: value, source: 'code' });
    }, 500);
  }, [setGameCode]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setGameCode({ script: newCode, source: 'code' });
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const line = code.substring(lineStart, start);
      const indent = line.match(/^(\s*)/)?.[1] || '';
      const prevChar = code[start - 1];
      const nextChar = code[start];
      let insertion = '\n' + indent;

      if (prevChar === '{' || prevChar === '(' || prevChar === '[') {
        insertion = '\n' + indent + '  ';
        if (nextChar === '}' || nextChar === ')' || nextChar === ']') {
          insertion += '\n' + indent;
        }
      }

      const newCode = code.substring(0, start) + insertion + code.substring(start);
      setCode(newCode);
      setLineCount(newCode.split('\n').length);
      setGameCode({ script: newCode, source: 'code' });

      const cursorPos = start + insertion.length - (nextChar === '}' || nextChar === ')' || nextChar === ']' ? indent.length + 1 : 0);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPos;
      });
    }
  };

  return (
    <div className="flex h-full bg-[#0a0f1a]">
      <div className="w-12 flex-shrink-0 bg-[#0d1220] border-r border-dark-600 pt-3 text-right pr-2 select-none overflow-hidden">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="text-[11px] leading-5 font-mono text-gray-600">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="flex-1 bg-transparent text-[#e0e0e0] font-mono text-[13px] leading-5 p-3 resize-none outline-none overflow-auto"
        placeholder="// Ваш код игры здесь...
// game.move('player', 1, 0, 0)
// game.rotate('player', 0, 90, 0)
// if (engine.isKeyPressed('Space')) { ... }"
      />
    </div>
  );
}
