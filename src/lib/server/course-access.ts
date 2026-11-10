import { getDbClient } from "@/lib/db";

export async function hasCourseAccess(userId: string, role: string, courseId: string) {
  if (role === "ADMIN") return true;

  const enrollment = await getDbClient().enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: "ACTIVE",
      course: { isPublished: true },
    },
    select: { id: true },
  });

  return enrollment !== null;
}
