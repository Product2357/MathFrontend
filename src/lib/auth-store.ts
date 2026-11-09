export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  premium: boolean;
};

export type LessonProgress = {
  [lessonId: string]: {
    completed: boolean;
    score: number;
  };
};

const USER_KEY = "mathmentor-user";
const PROGRESS_KEY = "mathmentor-progress";

export function getStoredUser(): AppUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AppUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredProgress(): LessonProgress {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as LessonProgress) : {};
  } catch {
    return {};
  }
}

export function saveStoredProgress(progress: LessonProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
