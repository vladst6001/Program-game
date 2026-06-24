interface TutorialStepProps {
  stepNumber: number;
  title: string;
  instruction: string;
  hintColor?: string;
  onNext?: () => void;
  onComplete?: () => void;
  isLast?: boolean;
}

export default function TutorialStep({
  stepNumber,
  title,
  instruction,
  hintColor = '#0066ff',
  onNext,
  onComplete,
  isLast = false,
}: TutorialStepProps) {
  return (
    <div className="panel p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-neon-green/20 border border-neon-green/40 flex items-center justify-center text-neon-green font-bold text-sm">
          {stepNumber}
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed mb-6">{instruction}</p>

      <div
        className="w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center mb-6"
        style={{ borderColor: hintColor + '60', backgroundColor: hintColor + '10' }}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 mx-auto mb-2 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke={hintColor}
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <span className="text-xs opacity-50" style={{ color: hintColor }}>
            Визуальная подсказка
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {!isLast && onNext && (
          <button onClick={onNext} className="btn-neon flex-1">
            Следующий шаг
          </button>
        )}
        {isLast && onComplete && (
          <button onClick={onComplete} className="btn-neon flex-1">
            Завершить урок
          </button>
        )}
      </div>
    </div>
  );
}
