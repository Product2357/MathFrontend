import { NextResponse } from "next/server";
import { adminMetrics, adminUsers } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    metrics: adminMetrics,
    users: adminUsers,
  });
}
