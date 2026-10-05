import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/api-auth";
import { createPeriod, listPeriods } from "@/lib/periods";
import { createPeriodSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const periods = await listPeriods(user.id);
  return NextResponse.json(periods);
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createPeriodSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const period = await createPeriod(user.id, parsed.data);
    return NextResponse.json(period, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A period already exists for this month." },
        { status: 409 },
      );
    }
    throw error;
  }
}
