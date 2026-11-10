import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbClient } from "@/lib/db";
import { requireAdmin } from "@/lib/server/admin";

const questionSchema = z.object({
  prompt: z.string().trim().min(3).max(2000),
  type: z.enum(["MULTIPLE_CHOICE", "NUMERIC", "FORMULA"]),
  choices: z.array(z.string().trim().min(1).max(300)).min(2).max(8).optional(),
  correctAnswer: z.union([z.string().trim().min(1).max(300), z.number().finite()]),
}).superRefine((question, context) => {
  if (question.type === "MULTIPLE_CHOICE" && !question.choices?.includes(String(question.correctAnswer))) {
    context.addIssue({ code: "custom", message: "Правильный вариант должен быть в списке ответов", path: ["correctAnswer"] });
  }
});

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = questionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверьте текст вопроса и правильный ответ" }, { status: 400 });

  const { lessonId } = await context.params;
  const db = getDbClient();
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });

  const question = await db.question.create({
    data: {
      lessonId,
      prompt: parsed.data.prompt,
      type: parsed.data.type,
      choices: parsed.data.choices,
      correctAnswer: parsed.data.correctAnswer,
    },
    select: { id: true, prompt: true, type: true, choices: true },
  });

  return NextResponse.json({ question }, { status: 201 });
}