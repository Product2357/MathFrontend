import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/session";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user?.role === "ADMIN" ? "/admin" : user ? "/dashboard" : "/auth/sign-in");
}
