export type Lesson = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  lessonsCount: number;
  image: string;
  accent: string;
  price: number;
  modules: Module[];
};

export const courses: Course[] = [
  {
    id: "course-algebra",
    slug: "algebra",
    title: "Алгебра",
    description:
      "Освойте линейные уравнения, функции, системы и базовую алгебру для экзаменов и школьной программы.",
    level: "Beginner",
    lessonsCount: 18,
    image:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=900&q=80",
    accent: "from-sky-500 to-blue-600",
    price: 49,
    modules: [
      {
        id: "mod-1",
        title: "Линейные уравнения",
        lessons: [
          { id: "l1", title: "Что такое линейное уравнение", duration: "8 min", completed: true },
          { id: "l2", title: "Решение линейных уравнений", duration: "12 min", completed: true },
          { id: "l3", title: "Проверка ответа", duration: "7 min", completed: false },
        ],
      },
      {
        id: "mod-2",
        title: "Функции",
        lessons: [
          { id: "l4", title: "График линейной функции", duration: "10 min", completed: false },
          { id: "l5", title: "Наклон и точки пересечения", duration: "14 min", completed: false },
          { id: "l6", title: "Практика по функциям", duration: "9 min", completed: false },
        ],
      },
    ],
  },
  {
    id: "course-geometry",
    slug: "geometry",
    title: "Геометрия",
    description:
      "Изучите свойства фигур, тригонометрию, теоремы и решение задач на построение и доказательство.",
    level: "Intermediate",
    lessonsCount: 15,
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80",
    accent: "from-violet-500 to-purple-600",
    price: 59,
    modules: [
      {
        id: "mod-3",
        title: "Основы геометрии",
        lessons: [
          { id: "g1", title: "Точки, прямые и углы", duration: "9 min", completed: true },
          { id: "g2", title: "Параллельные линии", duration: "11 min", completed: true },
          { id: "g3", title: "Треугольники", duration: "13 min", completed: false },
        ],
      },
      {
        id: "mod-4",
        title: "Тригонометрия",
        lessons: [
          { id: "g4", title: "Определения синуса и косинуса", duration: "12 min", completed: false },
          { id: "g5", title: "Решение прямоугольных треугольников", duration: "14 min", completed: false },
        ],
      },
    ],
  },
  {
    id: "course-sat",
    slug: "sat-math",
    title: "Подготовка к SAT",
    description:
      "Набор практических модулей с тестами, аналитикой ошибок и адаптивным повторением тем.",
    level: "Advanced",
    lessonsCount: 27,
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    accent: "from-cyan-500 to-indigo-600",
    price: 79,
    modules: [
      {
        id: "mod-5",
        title: "Алгебра с экзаменационными задачами",
        lessons: [
          { id: "s1", title: "Системы уравнений", duration: "10 min", completed: false },
          { id: "s2", title: "Неравенства", duration: "12 min", completed: false },
          { id: "s3", title: "Функциональный анализ", duration: "15 min", completed: false },
        ],
      },
      {
        id: "mod-6",
        title: "Моделирование и данные",
        lessons: [
          { id: "s4", title: "Графики и интерпретация", duration: "13 min", completed: false },
          { id: "s5", title: "Сбор и анализ данных", duration: "11 min", completed: false },
        ],
      },
    ],
  },
];

export const pricing = [
  {
    name: "Free",
    price: 0,
    description: "Доступ к демо-урокам и базовому каталогу.",
    features: ["3 демо-урока", "Доступ к курсам в ознакомительном режиме", "Базовые тесты"],
  },
  {
    name: "Premium",
    price: 29,
    description: "Полный доступ ко всем урокам, заданиям и AI-подсказкам.",
    features: ["Все курсы", "Полный доступ к урокам", "AI-помощник", "Статистика обучения"],
    featured: true,
  },
];

export const progressData = [
  { title: "Алгебра", progress: 65, color: "bg-sky-500" },
  { title: "Геометрия", progress: 40, color: "bg-violet-500" },
  { title: "SAT Math", progress: 20, color: "bg-indigo-500" },
];

export const adminMetrics = [
  { label: "Пользователи", value: 1580 },
  { label: "Активные подписки", value: 760 },
  { label: "Курсы", value: 12 },
  { label: "Уроки", value: 148 },
];

export const adminUsers = [
  { name: "Алина К.", email: "alina@example.com", status: "Premium", active: true },
  { name: "Илья П.", email: "ilya@example.com", status: "Free", active: true },
  { name: "Сергей Д.", email: "sergey@example.com", status: "Premium", active: false },
];

export const lessonDetails = {
  "l1": {
    id: "l1",
    title: "Что такое линейное уравнение",
    duration: "8 min",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    theory: `Решение линейного уравнения вида ax + b = 0 сводится к изоляции переменной. Для этого сначала переносим свободный член вправо, а затем делим обе части на коэффициент при x.`,
    formula: "ax + b = 0",
    graph: "y = 2x - 4",
    questions: [
      {
        id: "q1",
        prompt: "Какое значение x удовлетворяет уравнению 2x - 4 = 0?",
        type: "multiple-choice",
        choices: ["x = 1", "x = 2", "x = 3", "x = 4"],
        correct: "x = 2",
      },
      {
        id: "q2",
        prompt: "Решите уравнение: 3x + 9 = 0",
        type: "numeric",
        answer: -3,
      },
    ],
  },
  "g1": {
    id: "g1",
    title: "Точки, прямые и углы",
    duration: "9 min",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    theory: `Угол образован двумя лучами с общей вершиной. В геометрии часто используют свойства смежных и вертикальных углов для решения задач и доказательств.`,
    formula: "∠A + ∠B = 180°",
    graph: "y = x",
    questions: [
      {
        id: "gq1",
        prompt: "Сумма смежных углов равна:",
        type: "multiple-choice",
        choices: ["90°", "120°", "180°", "360°"],
        correct: "180°",
      },
    ],
  },
};
