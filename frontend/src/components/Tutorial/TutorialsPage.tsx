import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorialsApi, Tutorial } from '../../api/tutorials';
import TutorialStep from './TutorialStep';

interface TutorialWithProgress extends Tutorial {
  stepCount: number;
  completedSteps: number;
  isCompleted: boolean;
}

const DEFAULT_TUTORIALS: TutorialWithProgress[] = [
  { id: '1', title: 'Основы Blockly', description: 'Научитесь создавать логику игры с помощью блоков', category: 'blockly', difficulty: 'beginner', content: '', created_at: '', stepCount: 4, completedSteps: 0, isCompleted: false },
  { id: '2', title: '3D Сцена', description: 'Создайте свою первую 3D-сцену с объектами', category: '3d', difficulty: 'beginner', content: '', created_at: '', stepCount: 5, completedSteps: 0, isCompleted: false },
  { id: '3', title: 'Скрипты и события', description: 'Используйте JavaScript для управления игрой', category: 'logic', difficulty: 'intermediate', content: '', created_at: '', stepCount: 6, completedSteps: 0, isCompleted: false },
  { id: '4', title: '2D Графика', description: 'Создавайте 2D-игры с плоской графикой', category: '2d', difficulty: 'intermediate', content: '', created_at: '', stepCount: 5, completedSteps: 0, isCompleted: false },
];

const TUTORIAL_STEPS: Record<string, { title: string; instruction: string; hintColor: string }[]> = {
  '1': [
    { title: 'Добро пожаловать в Blockly!', instruction: 'Blockly — это визуальный редактор кода. Вы соединяете блоки, как пазл, чтобы создавать логику игры.', hintColor: '#00ff88' },
    { title: 'Блоки событий', instruction: 'Блок "При старте" выполняется один раз при запуске игры. Блок "Каждый кадр" — повторяется 60 раз в секунду.', hintColor: '#00ff88' },
    { title: 'Действия', instruction: 'Блоки действий заставляют объекты двигаться, поворачиваться и взаимодействовать. Подключите их к блокам событий.', hintColor: '#0066ff' },
    { title: 'Готово!', instruction: 'Вы знаете основы Blockly. Попробуйте создать свою первую игру в редакторе!', hintColor: '#00ff88' },
  ],
  '2': [
    { title: 'Создаём сцену', instruction: '3D-сцена — это пространство, где живут ваши объекты. Начните с добавления куба.', hintColor: '#0066ff' },
    { title: 'Объекты', instruction: 'Каждый объект имеет позицию, вращение и масштаб. Выберите объект на сцене, чтобы увидеть его свойства.', hintColor: '#0066ff' },
    { title: 'Камера', instruction: 'Камера определяет, что видит игрок. Вы можете перемещать камеру мышью или колёсиком.', hintColor: '#00ff88' },
    { title: 'Свет', instruction: 'Освещение делает сцену реалистичной. Попробуйте изменить цвет и интенсивность света.', hintColor: '#ffcc00' },
    { title: 'Экспериментируйте!', instruction: 'Поэкспериментируйте с разными объектами и настройками. Чем больше практика — тем лучше результат!', hintColor: '#cc00ff' },
  ],
  '3': [
    { title: 'JavaScript в игре', instruction: 'Помимо Blockly, вы можете писать код напрямую на JavaScript для более сложной логики.', hintColor: '#ffcc00' },
    { title: 'События клавиатуры', instruction: 'Используйте engine.isKeyPressed() для обработки нажатий клавиш. Игрок сможет управлять персонажем!', hintColor: '#ff6600' },
    { title: 'Движение объектов', instruction: 'game.move() перемещает объект на заданное расстояние. Используйте это для анимации и физики.', hintColor: '#0066ff' },
    { title: 'Столкновения', instruction: 'game.touches() проверяет, касается ли один объект другого. Это основа игровой физики!', hintColor: '#ff0066' },
    { title: 'Звуки', instruction: 'game.playSound() воспроизводит звук. Добавьте звуковые эффекты для прыжков и столкновений.', hintColor: '#cc00ff' },
    { title: 'Попробуйте сами!', instruction: 'Откройте редактор кода и напишите свою первую игру. Начните с простого — пусть куб двигается на клавиши!', hintColor: '#00ff88' },
  ],
  '4': [
    { title: '2D-режим', instruction: 'Переключитесь в режим 2D для создания плоских игр — платформеров, аркад и пазлов.', hintColor: '#0066ff' },
    { title: 'Спрайты', instruction: 'Спрайты — это 2D-изображения объектов. Выберите тип "plane" и задайте изображение.', hintColor: '#cc00ff' },
    { title: 'Физика 2D', instruction: 'В 2D-режиме работают законы физики — гравитация, прыжки, отскок от стен.', hintColor: '#00ff88' },
    { title: 'UI-элементы', instruction: 'Используйте game.showText() для отображения счёта, здоровья и других UI-элементов.', hintColor: '#ffcc00' },
    { title: 'Соберите игру!', instruction: 'Комбинируйте спрайты, физику и UI для создания полноценной 2D-игры. Удачи!', hintColor: '#00ff88' },
  ],
};

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<TutorialWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialWithProgress | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    tutorialsApi
      .list(category ? { category } : undefined)
      .then(({ data }) => {
        const apiTutorials: TutorialWithProgress[] = (data.tutorials || []).map((t) => ({
          ...t,
          stepCount: 5,
          completedSteps: 0,
          isCompleted: false,
        }));
        const all = apiTutorials.length > 0 ? apiTutorials : DEFAULT_TUTORIALS;
        setTutorials(all);
      })
      .catch(() => setTutorials(DEFAULT_TUTORIALS))
      .finally(() => setLoading(false));
  }, [category]);

  const getProgress = useCallback((t: TutorialWithProgress) => {
    return t.stepCount > 0 ? Math.round((t.completedSteps / t.stepCount) * 100) : 0;
  }, []);

  const handleNextStep = useCallback(() => {
    if (!selectedTutorial) return;
    const steps = TUTORIAL_STEPS[selectedTutorial.id] || [];
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [selectedTutorial, currentStep]);

  const handleComplete = useCallback(async () => {
    if (!selectedTutorial) return;
    setTutorials((prev) =>
      prev.map((t) =>
        t.id === selectedTutorial.id
          ? { ...t, completedSteps: t.stepCount, isCompleted: true }
          : t
      )
    );
    // API call to save progress would go here
    setSelectedTutorial(null);
    setCurrentStep(0);
  }, [selectedTutorial]);

  const handleStartTutorial = useCallback((t: TutorialWithProgress) => {
    setSelectedTutorial(t);
    setCurrentStep(Math.min(t.completedSteps, (TUTORIAL_STEPS[t.id]?.length || 1) - 1));
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setSelectedTutorial(null);
      setCurrentStep(0);
    }
  }, [currentStep]);

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-neon-green/10 text-neon-green',
    intermediate: 'bg-neon-blue/10 text-neon-blue',
    advanced: 'bg-neon-purple/10 text-neon-purple',
  };

  if (selectedTutorial) {
    const steps = TUTORIAL_STEPS[selectedTutorial.id] || [];
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
      <div className="h-screen flex flex-col bg-dark-900">
        <div className="h-14 bg-dark-800 border-b border-dark-500 flex items-center px-6 shrink-0">
          <button onClick={handleBack} className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; {currentStep > 0 ? 'Назад' : 'Уроки'}
          </button>
          <h1 className="ml-4 text-lg font-bold text-neon-blue">{selectedTutorial.title}</h1>
          <div className="flex-1" />
          <span className="text-[11px] text-gray-500">{currentStep + 1} / {steps.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="w-full bg-dark-700 rounded-full h-1.5">
              <div
                className="bg-neon-blue h-1.5 rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {step && (
            <TutorialStep
              stepNumber={currentStep + 1}
              title={step.title}
              instruction={step.instruction}
              hintColor={step.hintColor}
              onNext={!isLast ? handleNextStep : undefined}
              onComplete={isLast ? handleComplete : undefined}
              isLast={isLast}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <div className="h-14 bg-dark-800 border-b border-dark-500 flex items-center px-6 shrink-0">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">
          &larr; Gallery
        </button>
        <h1 className="ml-4 text-lg font-bold text-neon-blue">Tutorials</h1>
      </div>

      <div className="flex gap-2 px-6 pt-4 flex-wrap">
        {['', 'blockly', '3d', '2d', 'logic'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              category === cat
                ? 'border-neon-blue/50 bg-neon-blue/10 text-neon-blue'
                : 'border-dark-500 text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat || 'All'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
          </div>
        ) : tutorials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="text-4xl">📚</div>
            <p className="text-gray-500">Нет доступных уроков</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {tutorials.map((t) => {
              const progress = getProgress(t);
              const totalSteps = TUTORIAL_STEPS[t.id]?.length || t.stepCount;
              return (
                <div
                  key={t.id}
                  onClick={() => handleStartTutorial(t)}
                  className="panel p-4 cursor-pointer hover:border-neon-blue/40 transition-all hover:shadow-neon-sm-blue group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-white group-hover:text-neon-blue transition-colors">
                      {t.title}
                    </h3>
                    {t.isCompleted && (
                      <div className="w-5 h-5 rounded-full bg-neon-green/20 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{t.description}</p>

                  <div className="w-full bg-dark-700 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all ${t.isCompleted ? 'bg-neon-green' : 'bg-neon-blue'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${difficultyColors[t.difficulty] || 'bg-dark-600 text-gray-400'}`}>
                        {t.difficulty}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-600 text-gray-400">
                        {t.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {t.completedSteps}/{totalSteps} шагов
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
