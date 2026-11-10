import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Регистрация закрыта. Обратитесь к администратору." }, { status: 410 });
}