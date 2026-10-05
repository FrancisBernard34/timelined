import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { replaceTasks } from "@/lib/periods";
import { updateScheduleSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const period = await replaceTasks(user.id, id, parsed.data.tasks);

  if (!period) {
    return NextResponse.json({ error: "Period not found" }, { status: 404 });
  }

  return NextResponse.json(period);
}
