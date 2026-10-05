import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  return NextResponse.json(user);
}
