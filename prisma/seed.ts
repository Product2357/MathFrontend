import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed the database");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const courseData = [
    {
      id: "course-algebra",
      slug: "algebra",
      title: "Алгебра",
      description: "Линейные уравнения, функции и базовая алгебра.",
      level: "Beginner",
      price: 49,
    },
    {
      id: "course-geometry",
      slug: "geometry",
      title: "Геометрия",
      description: "Основные свойства фигур и углов.",
      level: "Intermediate",
      price: 59,
    },
  ];

  for (const course of courseData) {
    await db.course.upsert({
      where: { slug: course.slug },
      update: { ...course, isPublished: true },
      create: { ...course, isPublished: true },
    });
  }

  await db.module.upsert({
    where: { id: "mod-1" },
    update: { title: "Линейные уравнения", order: 1, courseId: "course-algebra" },
    create: { id: "mod-1", title: "Линейные уравнения", order: 1, courseId: "course-algebra" },
  });
  await db.module.upsert({
    where: { id: "mod-3" },
    update: { title: "Основы геометрии", order: 1, courseId: "course-geometry" },
    create: { id: "mod-3", title: "Основы геометрии", order: 1, courseId: "course-geometry" },
  });

  await db.lesson.upsert({
    where: { id: "l1" },
    update: {
      title: "Что такое линейное уравнение",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      theory: "Решение уравнения вида ax + b = 0 сводится к изоляции переменной.",
      order: 1,
      moduleId: "mod-1",
    },
    create: {
      id: "l1",
      title: "Что такое линейное уравнение",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      theory: "Решение уравнения вида ax + b = 0 сводится к изоляции переменной.",
      order: 1,
      moduleId: "mod-1",
    },
  });
  await db.lesson.upsert({
    where: { id: "g1" },
    update: {
      title: "Точки, прямые и углы",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      theory: "Смежные углы образуют развернутый угол, сумма их величин равна 180°.",
      order: 1,
      moduleId: "mod-3",
    },
    create: {
      id: "g1",
      title: "Точки, прямые и углы",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      theory: "Смежные углы образуют развернутый угол, сумма их величин равна 180°.",
      order: 1,
      moduleId: "mod-3",
    },
  });

  const questions = [
    { id: "q1", lessonId: "l1", prompt: "Какое значение x удовлетворяет уравнению 2x - 4 = 0?", type: "MULTIPLE_CHOICE" as const, choices: ["x = 1", "x = 2", "x = 3", "x = 4"], correctAnswer: "x = 2" },
    { id: "q2", lessonId: "l1", prompt: "Решите уравнение: 3x + 9 = 0", type: "NUMERIC" as const, correctAnswer: -3 },
    { id: "gq1", lessonId: "g1", prompt: "Сумма смежных углов равна:", type: "MULTIPLE_CHOICE" as const, choices: ["90°", "120°", "180°", "360°"], correctAnswer: "180°" },
  ];

  for (const question of questions) {
    await db.question.upsert({
      where: { id: question.id },
      update: question,
      create: question,
    });
  }
}

main()
  .then(() => console.log("Seeded 2 courses and 3 lesson questions"))
  .finally(() => db.$disconnect());